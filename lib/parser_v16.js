const _ = require('lodash')
const ParserBase = require('./parser_base')

class JoiJsonSchemaParser extends ParserBase {
  constructor(joiObj) {
    super(joiObj)
  }

  static getVersion(joiObj) {
    return joiObj.$_root.version
  }

  static getSupportVersion() {
    return '16'
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

  _getFieldDescription(fieldDefn) {
    return _.get(fieldDefn, 'flags.description')
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
          fieldSchema.exclusiveMinimum = true
          fieldSchema.minimum = value.limit
          break
        case 'less':
          fieldSchema.exclusiveMaximum = true
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
    _.forEach(fieldDefn.meta, (m) => {
      if (m.contentMediaType) {
        fieldSchema.contentMediaType = m.contentMediaType
      }
    })

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
        case 'phoneNumber':
          fieldSchema.format = 'phoneNumber'
          fieldSchema.defaultCountry = rule[ruleArgFieldName].defaultCountry || null
          fieldSchema.phoneNumberFormat = rule[ruleArgFieldName].format || null
          fieldSchema.strict = rule[ruleArgFieldName].strict || false
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

  _setAlternativesProperties(schema, joiDescribe) {
    if (schema.type !== 'alternatives') {
      return
    }

    const that = this
    schema.oneOf = _.map(joiDescribe.matches, (match) => {
      return that._convertSchema(match.schema)
    })

    delete schema.type
  }
}

module.exports = JoiJsonSchemaParser
