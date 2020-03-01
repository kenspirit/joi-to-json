/* eslint no-use-before-define: "off" */
const _ = require('lodash')

class JoiJsonSchemaParser {
  constructor(joiObj) {
    if (typeof joiObj.describe !== 'function') {
      throw new Error('Not an joi object to be described.')
    }

    this.joiObj = joiObj
    this.joiDescribe = joiObj.describe()
    this.childrenFieldName = this._getChildrenFieldName()
    this.ruleArgFieldName = this._getRuleArgFieldName()
    this.enumFieldName = this._getEnumFieldName()
    this.jsonSchema = this._convertSchema(this.joiDescribe)
  }

  static getVersion(joiObj) {
    return joiObj._currentJoi.version
  }

  static getSupportVersion() {
    return '12'
  }

  _getChildrenFieldName() {
    return 'children'
  }

  _getRuleArgFieldName() {
    return 'arg'
  }

  _getEnumFieldName() {
    return 'valids'
  }

  _convertSchema(joiDescribe) {
    const schema = {}

    this._setBasicProperties(schema, joiDescribe)
    this._setNumberFieldProperties(schema, joiDescribe)
    this._setBinaryFieldProperties(schema, joiDescribe)
    this._setStringFieldProperties(schema, joiDescribe)
    this._setDateFieldProperties(schema, joiDescribe)
    this._setArrayFieldProperties(schema, joiDescribe)
    this._setObjectProperties(schema, joiDescribe)
    this._setAlternativesProperties(schema, joiDescribe)

    return schema
  }

  _getFieldType(fieldDefn) {
    let type = fieldDefn.type
    if (type === 'number' && !_.isEmpty(fieldDefn.rules) &&
      fieldDefn.rules[0].name === 'integer') {
      type = 'integer'
    }
    return type
  }

  _getFieldDescription(fieldDefn) {
    return _.get(fieldDefn, 'description')
  }

  _getFieldExample(fieldDefn) {
    return _.get(fieldDefn, 'examples')
  }

  _isRequired(fieldDefn) {
    return _.get(fieldDefn, 'flags.presence') === 'required'
  }

  _getDefaultValue(fieldDefn) {
    return _.get(fieldDefn, 'flags.default')
  }

  _getEnum(fieldDefn) {
    if (_.isEmpty(fieldDefn[this.enumFieldName])) {
      return undefined
    }

    const enumList = _.filter(fieldDefn[this.enumFieldName], (item) => {
      return !_.isEmpty(item)
    })
    return _.isEmpty(enumList) ? undefined : enumList
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
          fieldSchema.maximum = value
          break
        case 'min':
          fieldSchema.minimum = value
          break
        case 'greater':
          fieldSchema.exclusiveMinimum = true
          fieldSchema.minimum = value
          break
        case 'less':
          fieldSchema.exclusiveMaximum = true
          fieldSchema.maximum = value
          break
        case 'multiple':
          fieldSchema.multipleOf = value
          break
        default:
          break
      }
    })
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

  _setStringFieldProperties(fieldSchema, fieldDefn) {
    if (fieldSchema.type !== 'string') {
      return
    }

    if (fieldDefn.flags && fieldDefn.flags.encoding) {
      fieldSchema.contentEncoding = fieldDefn.flags.encoding
    }
    _.forEach(fieldDefn.meta, (m) => {
      if (m.contentMediaType) {
        fieldSchema.contentMediaType = m.contentMediaType
      }
    })

    const ruleArgFieldName = this.ruleArgFieldName

    _.forEach(fieldDefn.rules, (rule) => {
      switch (rule.name) {
        case 'min':
          fieldSchema.minLength = rule[ruleArgFieldName]
          break
        case 'max':
          fieldSchema.maxLength = rule[ruleArgFieldName]
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
          const versions = rule[ruleArgFieldName].version
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
        case 'regex':
          fieldSchema.pattern = rule[ruleArgFieldName].pattern.source
          break
        default:
          break
      }
    })
  }

  _setArrayFieldProperties(fieldSchema, fieldDefn) {
    if (fieldSchema.type !== 'array') {
      return
    }

    const ruleArgFieldName = this.ruleArgFieldName

    _.each(fieldDefn.rules, (rule) => {
      const value = rule[ruleArgFieldName]
      switch (rule.name) {
        case 'max':
          fieldSchema.maxItems = value
          break
        case 'min':
          fieldSchema.minItems = value
          break
        case 'length':
          fieldSchema.maxItems = value
          fieldSchema.minItems = value
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
      fieldSchema.items = this._convertSchema(fieldDefn.items[0])
    } else {
      fieldSchema.items = {
        anyOf: _.map(fieldDefn.items, this._convertSchema.bind(this))
      }
    }
  }

  _setDateFieldProperties(fieldSchema, fieldDefn) {
    if (fieldSchema.type !== 'date') {
      return
    }

    if (fieldDefn.flags && fieldDefn.flags.timestamp) {
      fieldSchema.type = 'integer'
    } else {
      // https://datatracker.ietf.org/doc/draft-handrews-json-schema-validation
      // JSON Schema does not have date type, but use string with format.
      // However, joi definition cannot clearly tells the date/time/date-time format
      fieldSchema.type = 'string'
      fieldSchema.format = 'date-time'
    }
  }

  _setObjectProperties(schema, joiDescribe) {
    if (schema.type !== 'object') {
      return
    }

    schema.properties = {}
    schema.required = []

    if (joiDescribe.flags && typeof joiDescribe.flags.allowUnknown !== 'undefined') {
      schema.additionalProperties = joiDescribe.flags.allowUnknown
    }

    const that = this
    _.map(joiDescribe[this.childrenFieldName], (fieldDefn, key) => {
      const fieldSchema = that._convertSchema(fieldDefn)
      if (that._isRequired(fieldDefn)) {
        schema.required.push(key)
      }

      schema.properties[key] = fieldSchema
    })
    if (_.isEmpty(schema.required)) {
      delete schema.required
    }
  }

  _setAlternativesProperties(schema, joiDescribe) {
    if (schema.type !== 'alternatives') {
      return
    }

    schema.oneOf = _.map(joiDescribe.alternatives, this._convertSchema.bind(this))
    delete schema.type
  }
}

module.exports = JoiJsonSchemaParser
