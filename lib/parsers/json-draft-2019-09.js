const _ = require('lodash')
const JoiJsonSchemaParser = require('./json')

class JoiJsonDraftSchemaParser extends JoiJsonSchemaParser {
  constructor(opts = {}) {
    super(_.merge({
      $schema: 'https://json-schema.org/draft/2019-09/schema'
    }, opts))
  }

  _copyMetasToSchema(joiSpec, schema) {
    if (!_.isEmpty(joiSpec.metas)) {
      _.each(joiSpec.metas, meta => {
        _.each(meta, (value, key) => {
          if (key === 'deprecated' || key === 'readOnly' || key === 'writeOnly') {
            schema[key] = value
          }
        })
      })
    }
  }
}

module.exports = JoiJsonDraftSchemaParser
