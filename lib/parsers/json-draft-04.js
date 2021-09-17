const _ = require('lodash')
const JoiJsonSchemaParser = require('./json')

class JoiOpenApiSchemaParser extends JoiJsonSchemaParser {
  _setNumberFieldProperties(fieldSchema, fieldDefn) {
    super._setNumberFieldProperties(fieldSchema, fieldDefn)

    if (typeof fieldSchema.minimum !== 'undefined' && fieldSchema.minimum === fieldSchema.exclusiveMinimum) {
      fieldSchema.exclusiveMinimum = true
    }
    if (typeof fieldSchema.maximum !== 'undefined' && fieldSchema.maximum === fieldSchema.exclusiveMaximum) {
      fieldSchema.exclusiveMaximum = true
    }
  }
}

module.exports = JoiOpenApiSchemaParser
