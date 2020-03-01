const _ = require('lodash')
const ParserBase = require('./parser_base')

class JoiJsonSchemaParser extends ParserBase {
  constructor(joiObj) {
    super(joiObj)
  }

  static getSupportVersion() {
    return '14'
  }

  _getFieldExample(fieldDefn) {
    if (fieldDefn.examples && fieldDefn.examples.length === 1) {
      const example = fieldDefn.examples[0]
      // options: { parent: xxx, context: yyy }
      // if (example.options) {
      // }
      return [example.value]
    }

    return undefined
  }
}

module.exports = JoiJsonSchemaParser
