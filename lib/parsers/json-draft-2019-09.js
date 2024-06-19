const _ = require('lodash')
const JoiJsonSchemaParser = require('./json')

class JoiJsonDraftSchemaParser extends JoiJsonSchemaParser {
  constructor(opts = {}) {
    super(_.merge({
      $schema: 'https://json-schema.org/draft/2019-09/schema'
    }, opts))
  }

  _isKnownMetaKey(key) {
    return key === 'deprecated' || key === 'readOnly' || key === 'writeOnly'
  }
}

module.exports = JoiJsonDraftSchemaParser
