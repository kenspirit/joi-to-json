/* eslint no-use-before-define: 'off' */
const _ = require('lodash')

class JoiJsonSchemaParser {
  constructor() {
    this.childrenFieldName = this._getChildrenFieldName()
    this.optionsFieldName = this._getOptionsFieldName()
    this.ruleArgFieldName = this._getRuleArgFieldName()
    this.enumFieldName = this._getEnumFieldName()
    this.allowUnknownFlagName = this._getAllowUnknownFlagName()
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
    this._setAnyProperties(schema, joiSpec, definitions, level)
    this._addNullTypeIfNullable(schema, joiSpec)
    this._setMetaProperties(schema, joiSpec)
    this._setLinkFieldProperties(schema, joiSpec)

    if (!_.isEmpty(joiSpec.shared)) {
      this.parse(joiSpec.shared[0], definitions, level)
    }

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

    return schema
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
    const enums = _.get(fieldDefn, this.enumFieldName)
    if (Array.isArray(enums) && enums.includes(null)) {
      fieldSchema.type = [fieldSchema.type, 'null']
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

  _getConst(fieldDefn) {
    const enumList = fieldDefn[this.enumFieldName]
    if (fieldDefn.flags && fieldDefn.flags.only && enumList.length === 1) {
      return enumList[0]
    }
  }

  _getEnum(fieldDefn) {
    const enumList = fieldDefn[this.enumFieldName]
    if (fieldDefn.flags && fieldDefn.flags.only && enumList.length > 1) {
      return _.uniq(enumList)
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
    this._setIfNotEmpty(fieldSchema, 'const', this._getConst(fieldDefn))
    this._setIfNotEmpty(fieldSchema, 'enum', this._getEnum(fieldDefn))
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
    if (schema.type !== 'alternatives') {
      return
    }

    if (joiSpec.matches.length === 1) {
      const match = joiSpec.matches[0]
      if (match.switch) {
        schema.oneOf = _.map(match.switch, (condition) => {
          return this.parse(condition.then || condition.otherwise, definitions, level + 1)
        })
      } else if (match.then || match.otherwise) {
        schema.oneOf = []
        if (match.then) schema.oneOf.push(this.parse(match.then, definitions, level + 1))
        if (match.otherwise) schema.oneOf.push(this.parse(match.otherwise, definitions, level + 1))
      }
    } else {
      schema.oneOf = _.map(joiSpec.matches, (match) => {
        return this.parse(match.schema, definitions, level + 1)
      })
    }

    delete schema.type
  }

  _setAnyProperties(schema, joiSpec, definitions, level) {
    if (schema.type !== 'any') {
      return
    }

    if (joiSpec.whens) {
      const condition = joiSpec.whens[0]
      schema.oneOf = []
      if (condition.then) {
        schema.oneOf.push(this.parse(condition.then, definitions, level + 1))
      }
      if (condition.otherwise) {
        schema.oneOf.push(this.parse(condition.otherwise, definitions, level + 1))
      }
      delete schema.type
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
}

module.exports = JoiJsonSchemaParser
