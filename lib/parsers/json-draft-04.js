const _ = require('lodash')
const JoiJsonSchemaParser = require('./json')

class JoiJsonDraftSchemaParser extends JoiJsonSchemaParser {
  constructor(opts = {}) {
    super(_.merge({ logicalOpParser: { xor: null } }, opts))
  }

  _setNumberFieldProperties(fieldSchema, fieldDefn) {
    super._setNumberFieldProperties(fieldSchema, fieldDefn)

    if (typeof fieldSchema.minimum !== 'undefined' && fieldSchema.minimum === fieldSchema.exclusiveMinimum) {
      fieldSchema.exclusiveMinimum = true
    }
    if (typeof fieldSchema.maximum !== 'undefined' && fieldSchema.maximum === fieldSchema.exclusiveMaximum) {
      fieldSchema.exclusiveMaximum = true
    }
  }

  _getLocalSchemaBasePath() {
    return '#/definitions'
  }
}

module.exports = JoiJsonDraftSchemaParser
