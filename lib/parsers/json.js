/* eslint no-use-before-define: 'off' */
const _ = require('lodash')
const combinations = require('combinations')

/**
 * Default Joi logical operator (or/and/nand/xor/oxor) parsers
 */
const LOGICAL_OP_PARSER = {
  or: function (schema, dependency) {
    schema.anyOf = _.map(dependency.peers, (peer) => {
      return { required: [peer] }
    })
  },
  and: function (schema, dependency) {
    schema.oneOf = [{ required: dependency.peers }]
    schema.oneOf.push({
      allOf: _.map(dependency.peers, (peer) => {
        return { not: { required: [peer] } }
      })
    })
  },
  nand: function (schema, dependency) {
    schema.not = { required: dependency.peers }
  },
  xor: function (schema, dependency) {
    schema.if = {
      propertyNames: { enum: dependency.peers },
      minProperties: 2
    }
    schema.then = false
    schema.else = {
      oneOf: _.map(dependency.peers, (peer) => {
        return { required: [peer] }
      })
    }
  },
  oxor: function (schema, dependency) {
    schema.oneOf = _.map(dependency.peers, (peer) => {
      return { required: [peer] }
    })
    schema.oneOf.push({
      not: {
        oneOf: _.map(combinations(dependency.peers, 1, 2), (combination) => {
          return { required: combination }
        })
      }
    })
  },
  with: function (schema, dependency) {
    schema.dependentRequired = schema.dependentRequired || {}
    schema.dependentRequired[dependency.key] = dependency.peers
  },
  without: function (schema, dependency) {
    schema.if = { required: [dependency.key] }
    schema.then = {
      not: {
        anyOf: _.map(dependency.peers, (peer) => {
          return { required: [peer] }
        })
      }
    }
  }
}

/**
 * Recognize the `joi.override` representation in `describe()` output.
 *
 * `joi.override` is a Symbol that can be used in `joi.any().valid(…)`
 * statements, to reset the list of valid values. In `describe()` output, it
 * turns up as an object with 1 property:
 *
 * ```
 * { override: true }
 * ```
 */
function isJoiOverride(e) {
  return typeof e === 'object'
    && e !== null
    && Object.keys(e).length === 1
    && e.override === true
}

class JoiJsonSchemaParser {
  constructor(opts = {}) {
    this.$schema = opts.$schema || 'http://json-schema.org/draft-07/schema#'
    this.includeSchemaDialect = opts.includeSchemaDialect || false
    this.childrenFieldName = this._getChildrenFieldName()
    this.optionsFieldName = this._getOptionsFieldName()
    this.ruleArgFieldName = this._getRuleArgFieldName()
    this.enumFieldName = this._getEnumFieldName()
    this.allowUnknownFlagName = this._getAllowUnknownFlagName()

    if (opts.logicalOpParser === false) {
      this.logicalOpParser = {}
    } else {
      this.logicalOpParser = _.merge({}, LOGICAL_OP_PARSER, opts.logicalOpParser)
    }
  }

  parse(joiSpec, definitions = {}, level = 0) {
    let schema = {}

    if (this._getPresence(joiSpec) === 'forbidden') {
      schema.not = {}
      return schema
    }

    this._setBasicProperties(schema, joiSpec)
    this._setNumberFieldProperties(schema, joiSpec)
    this._setBinaryFieldProperties(schema, joiSpec)
    this._setStringFieldProperties(schema, joiSpec)
    this._setDateFieldProperties(schema, joiSpec)
    this._setArrayFieldProperties(schema, joiSpec, definitions, level)
    this._setObjectProperties(schema, joiSpec, definitions, level)
    this._setAlternativesProperties(schema, joiSpec, definitions, level)
    this._setConditionProperties(schema, joiSpec, definitions, level, 'whens')
    this._setMetaProperties(schema, joiSpec)
    this._setLinkFieldProperties(schema, joiSpec)
    this._setConst(schema, joiSpec)
    this._setAnyProperties(schema, joiSpec, definitions, level)
    this._addNullTypeIfNullable(schema, joiSpec)

    if (!_.isEmpty(joiSpec.shared)) {
      _.forEach(joiSpec.shared, (sharedSchema) => {
        this.parse(sharedSchema, definitions, level)
      })
    }

    this._copyMetasToSchema(joiSpec, schema)

    const schemaId = _.get(joiSpec, 'flags.id')
    if (schemaId) {
      definitions[schemaId] = schema
      schema = {
        $ref: `${this._getLocalSchemaBasePath()}/${schemaId}`
      }
    }
    if (level === 0 && !_.isEmpty(definitions)) {
      _.set(schema, `${this._getLocalSchemaBasePath().replace('#/', '').replace(/\//, '.')}`, definitions)
    }

    if (this.includeSchemaDialect && level === 0 && this.$schema) {
      schema.$schema = this.$schema
    }

    return schema
  }

  _isIfThenElseSupported() {
    return true
  }

  _getChildrenFieldName() {
    return 'keys'
  }

  _getOptionsFieldName() {
    return 'preferences'
  }

  _getRuleArgFieldName() {
    return 'args'
  }

  _getEnumFieldName() {
    return 'allow'
  }

  _getAllowUnknownFlagName() {
    return 'unknown'
  }

  _getLocalSchemaBasePath() {
    return '#/$defs'
  }

  _getFieldDescription(fieldDefn) {
    return _.get(fieldDefn, 'flags.description')
  }

  _getFieldType(fieldDefn) {
    let type = fieldDefn.type
    if (type === 'number' && !_.isEmpty(fieldDefn.rules) &&
      fieldDefn.rules[0].name === 'integer') {
      type = 'integer'
    }
    return type
  }

  _addNullTypeIfNullable(fieldSchema, fieldDefn) {
    // This should always be the last call in parse
    if (fieldSchema.const === null) {
      return
    }

    const enums = _.get(fieldDefn, this.enumFieldName)
    if (Array.isArray(enums) && enums.includes(null)) {
      if (Array.isArray(fieldSchema.type)) {
        if (!fieldSchema.type.includes('null')) {
          fieldSchema.type.push('null')
        }
      } else if (fieldSchema.type) {
        fieldSchema.type = [fieldSchema.type, 'null']
      } else {
        fieldSchema.type = 'null'
      }
    }
  }

  _getFieldExample(fieldDefn) {
    return _.get(fieldDefn, 'examples')
  }

  _getPresence(fieldDefn) {
    const presence = _.get(fieldDefn, 'flags.presence')
    if (presence !== undefined) {
      return presence
    }
    return _.get(fieldDefn, `${this.optionsFieldName}.presence`)
  }

  _isRequired(fieldDefn) {
    const presence = this._getPresence(fieldDefn)
    return presence === 'required'
  }

  _getDefaultValue(fieldDefn) {
    return _.get(fieldDefn, 'flags.default')
  }

  _getEnum(fieldDefn) {
    const enumList = fieldDefn[this.enumFieldName]
    const filteredEnumList = enumList ? _.filter(enumList, e => !isJoiOverride(e)) : enumList
    if (fieldDefn.flags && fieldDefn.flags.only && _.size(filteredEnumList) > 1) {
      return _.uniq(filteredEnumList)
    }
  }

  _getUnknown(joiSpec) {
    let allowUnknown = _.get(joiSpec, `${this.optionsFieldName}.allowUnknown`, false)
    if (joiSpec.flags && typeof joiSpec.flags[this.allowUnknownFlagName] !== 'undefined') {
      allowUnknown = joiSpec.flags[this.allowUnknownFlagName]
    }
    return allowUnknown
  }

  _setIfNotEmpty(schema, field, value) {
    if (value !== null && value !== undefined) {
      schema[field] = value
    }
  }

  _setBasicProperties(fieldSchema, fieldDefn) {
    this._setIfNotEmpty(fieldSchema, 'type', this._getFieldType(fieldDefn))
    this._setIfNotEmpty(fieldSchema, 'examples', this._getFieldExample(fieldDefn))
    this._setIfNotEmpty(fieldSchema, 'description', this._getFieldDescription(fieldDefn))
    this._setIfNotEmpty(fieldSchema, 'default', this._getDefaultValue(fieldDefn))
    this._setIfNotEmpty(fieldSchema, 'enum', this._getEnum(fieldDefn))
    if (fieldDefn.invalid && fieldDefn.invalid.length > 0) {
      fieldSchema.not = {
        type: fieldSchema.type,
        enum: fieldDefn.invalid
      }
    }
  }

  _setBinaryFieldProperties(fieldSchema, fieldDefn) {
    if (fieldSchema.type !== 'binary') {
      return
    }
    fieldSchema.type = 'string'
    if (fieldDefn.flags && fieldDefn.flags.encoding) {
      fieldSchema.contentEncoding = fieldDefn.flags.encoding
    }
    fieldSchema.format = 'binary'
  }

  _setObjectProperties(schema, joiSpec, definitions, level) {
    if (schema.type !== 'object') {
      return
    }

    schema.properties = {}
    schema.required = []

    schema.additionalProperties = this._getUnknown(joiSpec)

    _.map(joiSpec[this.childrenFieldName], (fieldDefn, key) => {
      const fieldSchema = this.parse(fieldDefn, definitions, level + 1)
      if (this._isRequired(fieldDefn)) {
        schema.required.push(key)
      }

      schema.properties[key] = fieldSchema
    })

    /**
     * For dynamic key scenarios to store the pattern as key
     * and have the properties be as with other examples
     */
    if (joiSpec.patterns) {
      _.each(joiSpec.patterns, patternObj => {
        if (typeof patternObj.rule !== 'object' || typeof patternObj.regex === 'undefined') {
          return
        }

        schema.properties[patternObj.regex] = {
          type: patternObj.rule.type,
          properties: {}
        }
        schema.properties[patternObj.regex].required = []

        const childKeys = patternObj.rule.keys || patternObj.rule.children
        schema.properties[patternObj.regex].additionalProperties = this._getUnknown(patternObj.rule)

        _.each(childKeys, (ruleObj, key) => {
          schema.properties[patternObj.regex].properties[key] = this.parse(ruleObj, definitions, level + 1)

          if (this._isRequired(ruleObj)) {
            schema.properties[patternObj.regex].required.push(key)
          }
        })

        schema.patternProperties = schema.patternProperties || {}

        let regexString = patternObj.regex
        regexString = regexString.indexOf('/') === 0 ? regexString.substring(1) : regexString
        regexString = regexString.lastIndexOf('/') > -1 ? regexString.substring(0, regexString.length - 1) : regexString

        schema.patternProperties[regexString] = schema.properties[patternObj.regex]
      })
    }

    if (_.isEmpty(schema.required)) {
      delete schema.required
    }

    this._setObjectDependencies(schema, joiSpec)
  }

  _setObjectDependencies(schema, joiSpec) {
    if (!_.isArray(joiSpec.dependencies) || joiSpec.dependencies.length === 0) {
      return
    }

    if (joiSpec.dependencies.length === 1) {
      this._setDependencySubSchema(schema, joiSpec.dependencies[0])
    } else {
      const withDependencies = _.remove(joiSpec.dependencies, (dependency) => {
        return dependency.rel === 'with'
      })

      schema.allOf = _.compact(_.map(joiSpec.dependencies, (dependency) => {
        const subSchema = this._setDependencySubSchema({}, dependency)
        if (_.isEmpty(subSchema)) {
          return null
        }
        return subSchema
      }))

      _.each(withDependencies, (dependency) => {
        this._setDependencySubSchema(schema, dependency)
      })

      if (schema.allOf.length === 0) {
        // When the logicalOpParser is set to false
        delete schema.allOf
      }
    }
  }

  _setDependencySubSchema(schema, dependency) {
    const opParser = this.logicalOpParser[dependency.rel]
    if (typeof opParser !== 'function') {
      return schema
    }
    opParser(schema, dependency)
    return schema
  }

  _setNumberFieldProperties(fieldSchema, fieldDefn) {
    if (fieldSchema.type !== 'number' && fieldSchema.type !== 'integer') {
      return
    }

    const ruleArgFieldName = this.ruleArgFieldName

    _.each(fieldDefn.rules, (rule) => {
      const value = rule[ruleArgFieldName]
      switch (rule.name) {
        case 'max':
          fieldSchema.maximum = value.limit
          break
        case 'min':
          fieldSchema.minimum = value.limit
          break
        case 'greater':
          fieldSchema.exclusiveMinimum = value.limit
          fieldSchema.minimum = value.limit
          break
        case 'less':
          fieldSchema.exclusiveMaximum = value.limit
          fieldSchema.maximum = value.limit
          break
        case 'multiple':
          fieldSchema.multipleOf = value.base
          break
        case 'sign':
          if (rule.args.sign === 'positive') {
            fieldSchema.exclusiveMinimum = 0
          } else if (rule.args.sign === 'negative') {
            fieldSchema.exclusiveMaximum = 0
          }
          break
        default:
          break
      }
    })
  }

  _setStringFieldProperties(fieldSchema, fieldDefn) {
    if (fieldSchema.type !== 'string') {
      return
    }

    if (fieldDefn.flags && fieldDefn.flags.encoding) {
      fieldSchema.contentEncoding = fieldDefn.flags.encoding
    }

    const ruleArgFieldName = this.ruleArgFieldName

    _.forEach(fieldDefn.rules, (rule) => {
      switch (rule.name) {
        case 'min':
          fieldSchema.minLength = rule[ruleArgFieldName].limit
          break
        case 'max':
          fieldSchema.maxLength = rule[ruleArgFieldName].limit
          break
        case 'email':
          fieldSchema.format = 'email'
          break
        case 'hostname':
          fieldSchema.format = 'hostname'
          break
        case 'uri':
          fieldSchema.format = 'uri'
          break
        case 'ip':
          const versions = rule[ruleArgFieldName].options.version
          if (!_.isEmpty(versions)) {
            if (versions.length === 1) {
              fieldSchema.format = versions[0]
            } else {
              fieldSchema.oneOf = _.map(versions, (version) => {
                return {
                  format: version
                }
              })
            }
          } else {
            fieldSchema.format = 'ipv4'
          }
          break
        case 'pattern':
          let regex = rule[ruleArgFieldName].regex
          let idx = regex.indexOf('/')
          if (idx === 0) {
            regex = regex.replace('/', '')
          }
          idx = regex.lastIndexOf('/') === regex.length - 1
          if (idx > -1) {
            regex = regex.replace(/\/$/, '')
          }
          fieldSchema.pattern = regex
          break
        case 'isoDate':
          fieldSchema.format = 'date-time'
          break
        case 'isoDuration':
          fieldSchema.format = 'duration'
          break
        case 'uuid':
        case 'guid':
          fieldSchema.format = 'uuid'
          break
        default:
          break
      }
    })
  }

  _setArrayFieldProperties(fieldSchema, fieldDefn, definitions, level) {
    if (fieldSchema.type !== 'array') {
      return
    }

    const ruleArgFieldName = this.ruleArgFieldName

    _.each(fieldDefn.rules, (rule) => {
      const value = rule[ruleArgFieldName]
      switch (rule.name) {
        case 'max':
          fieldSchema.maxItems = value.limit
          break
        case 'min':
          fieldSchema.minItems = value.limit
          break
        case 'length':
          fieldSchema.maxItems = value.limit
          fieldSchema.minItems = value.limit
          break
        case 'unique':
          fieldSchema.uniqueItems = true
          break
        case 'has':
          fieldSchema.contains = this.parse(value.schema, definitions, level + 1)
          break
        default:
          break
      }
    })

    if (!fieldDefn.items) {
      fieldSchema.items = {}
      return
    }

    if (fieldDefn.items.length === 1) {
      fieldSchema.items = this.parse(fieldDefn.items[0], definitions, level + 1)
    } else {
      fieldSchema.items = {
        anyOf: _.map(fieldDefn.items, (itemSchema) => {
          return this.parse(itemSchema, definitions, level + 1)
        })
      }
    }
  }

  _setDateFieldProperties(fieldSchema, fieldDefn) {
    if (fieldSchema.type !== 'date') {
      return
    }

    if (fieldDefn.flags && fieldDefn.flags.format !== 'iso') {
      fieldSchema.type = 'integer'
    } else {
      // https://datatracker.ietf.org/doc/draft-handrews-json-schema-validation
      // JSON Schema does not have date type, but use string with format.
      // However, joi definition cannot clearly tells the date/time/date-time format
      fieldSchema.type = 'string'
      fieldSchema.format = 'date-time'
    }
  }

  _setAlternativesProperties(schema, joiSpec, definitions, level) {
    if (schema.type !== 'alternatives' || joiSpec.matches.length === 0) {
      return
    }

    if (joiSpec.matches[0].schema) {
      // try style
      let mode = 'anyOf'
      if (joiSpec.flags && joiSpec.flags.match === 'one') {
        mode = 'oneOf'
      } else if (joiSpec.flags && joiSpec.flags.match === 'all') {
        mode = 'allOf'
      }

      schema[mode] = _.map(joiSpec.matches, (match) => {
        return this.parse(match.schema, definitions, level + 1)
      })

      if (schema[mode].length === 1) {
        _.merge(schema, schema[mode][0])
        delete schema[mode]
      }
    } else {
      this._setConditionProperties(schema, joiSpec, definitions, level, 'matches', 'anyOf')
    }

    if (schema.type === 'alternatives') {
      delete schema.type
    }
  }

  _setConditionProperties(schema, joiSpec, definitions, level, conditionFieldName, logicKeyword = 'allOf') {
    if (!joiSpec[conditionFieldName] || joiSpec[conditionFieldName].length === 0) {
      return
    }

    let ifThenStyle = this._isIfThenElseSupported()
    const styleSetting = _.remove(joiSpec.metas, (meta) => {
      return typeof meta['if-style'] !== undefined
    })

    if (ifThenStyle && styleSetting.length > 0 && styleSetting[0]['if-style'] === false) {
      ifThenStyle = false
    }

    if (joiSpec[conditionFieldName].length > 1) {
      // Multiple case
      schema[logicKeyword] = _.map(joiSpec[conditionFieldName], (condition) => {
        return this._setConditionSchema(ifThenStyle, {}, condition, definitions, level + 1)
      })
    } else {
      this._setConditionSchema(ifThenStyle, schema, joiSpec[conditionFieldName][0], definitions, level + 1)
    }
  }

  _setConditionSchema(ifThenStyle, schema, conditionJoiSpec, definitions, level) {
    // When "if" is not present, both "then" and "else" MUST be entirely ignored.
    // There must be either "is" or "switch"
    if (!conditionJoiSpec.is && !conditionJoiSpec.switch) {
      return
    }

    if (conditionJoiSpec.switch) {
      this._parseSwitchCondition(ifThenStyle, schema, conditionJoiSpec, definitions, level)
    } else {
      if (ifThenStyle) {
        this._parseIfThenElseCondition(schema, conditionJoiSpec, definitions, level)
      } else {
        this._setConditionCompositionStyle(schema, conditionJoiSpec, definitions, level)
      }
    }

    return schema
  }

  _parseIfThenElseCondition(schema, conditionSpec, definitions, level) {
    if (conditionSpec.ref) {
      // Currently, if there is reference, if-then-else style is not supported
      // To use it, the condition must be defined in parent level using schema-style is
      return this._setConditionCompositionStyle(schema, conditionSpec, definitions, level)
    }

    schema.if = this.parse(conditionSpec.is, definitions, level)

    if (conditionSpec.then) {
      schema.then = this.parse(conditionSpec.then, definitions, level)
    }
    if (conditionSpec.otherwise) {
      schema.else = this.parse(conditionSpec.otherwise, definitions, level)
    }
    return schema
  }

  _parseSwitchCondition(ifThenStyle, schema, condition, definitions, level) {
    // Switch cannot be used if the joi condition is a schema
    // Hence, condition.ref should always exists
    const anyOf = []
    for (const switchCondition of condition.switch) {
      if (ifThenStyle && !condition.ref) {
        const innerSchema = this._parseIfThenElseCondition(
          {}, switchCondition, definitions, level + 1)

        anyOf.push(innerSchema)
      } else {
        if (switchCondition.then) {
          anyOf.push(this.parse(switchCondition.then, definitions, level + 1))
        }

        if (switchCondition.otherwise) {
          anyOf.push(this.parse(switchCondition.otherwise, definitions, level + 1))
        }
      }
    }

    if (anyOf.length > 1) {
      schema.anyOf = anyOf
    } else {
      _.merge(schema, oneOf[0])
    }
  }

  _setConditionCompositionStyle(schema, condition, definitions, level) {
    if (condition.ref) {
      // If the condition is refering to other field, cannot use the `is` condition for composition
      // Simple choise between then / otherwise
      const oneOf = schema.oneOf || []
      if (condition.then) {
        oneOf.push(this.parse(condition.then, definitions, level + 1))
      }
      if (condition.otherwise) {
        oneOf.push(this.parse(condition.otherwise, definitions, level + 1))
      }
      if (oneOf.length > 1) {
        schema.oneOf = oneOf
      } else {
        _.merge(schema, oneOf[0])
      }
    } else {
      // Before Draft 7, you can express an “if-then” conditional using the Schema Composition keywords
      // and a boolean algebra concept called “implication”.
      // A -> B(pronounced, A implies B) means that if A is true, then B must also be true.
      // It can be expressed as !A || B

      // Variations of implication can express the same things you can express with the if/then/else keywords.
      // if/then can be expressed as A -> B, if/else can be expressed as !A -> B,
      // and if/then/else can be expressed as A -> B AND !A -> C
      if (condition.is && condition.then && condition.otherwise) {
        schema.allOf = [
          {
            anyOf: [
              {
                not: this.parse(condition.is, definitions, level + 1)
              },
              this.parse(condition.then, definitions, level + 1)
            ]
          },
          {
            anyOf: [
              this.parse(condition.is, definitions, level + 1),
              this.parse(condition.otherwise, definitions, level + 1)
            ]
          }
        ]
      } else if (condition.is && condition.then) {
        schema.anyOf = [
          {
            not: this.parse(condition.is, definitions, level + 1)
          },
          this.parse(condition.then, definitions, level + 1)
        ]
      }
    }

    return schema
  }

  _setConst(schema, fieldDefn) {
    const enumList = fieldDefn[this.enumFieldName]
    const filteredEnumList = enumList ? _.filter(enumList, e => !isJoiOverride(e)) : enumList
    if (fieldDefn.flags && fieldDefn.flags.only && _.size(filteredEnumList) === 1) {
      schema.const = filteredEnumList[0]
      delete schema.type
    }
  }

  _setAnyProperties(schema) {
    if (schema.type !== 'any') {
      return
    }

    schema.type = [
      'array',
      'boolean',
      'number',
      'object',
      'string',
      'null'
    ]
  }

  _setMetaProperties(schema, joiSpec) {
    _.forEach(joiSpec.metas, (m) => {
      if (m.contentMediaType) {
        schema.contentMediaType = m.contentMediaType
      }
      if (m.format) {
        schema.format = m.format
      }
      if (m.title) {
        schema.title = m.title
      }
    })
  }

  _setLinkFieldProperties(schema, joiSpec) {
    if (schema.type !== 'link') {
      return
    }

    if (_.get(joiSpec, 'link.ref.type') === 'local') {
      schema.$ref = `${this._getLocalSchemaBasePath()}/${joiSpec.link.ref.path.join('/')}`
      delete schema.type
    }
  }

  _copyMetasToSchema(joiSpec, schema) {
    if (!_.isEmpty(joiSpec.metas)) {
      _.each(joiSpec.metas, meta => {
        _.each(meta, (value, key) => {
          if (this._isKnownMetaKey(key)) {
            schema[key] = value
          }
        })
      })
    }
  }

  // Intended to be overridden by child parsers. By default no meta key will be
  // is considered "known".
  // eslint-disable-next-line no-unused-vars
  _isKnownMetaKey(key) {
    return false
  }
}

module.exports = JoiJsonSchemaParser
