const _ = require('lodash')
const JoiJsonSchemaParser = require('./json')

class JoiJsonDraftSchemaParser extends JoiJsonSchemaParser {
  parse(joiSpec, definitions = {}, level = 0) {
    const schema = super.parse(joiSpec, definitions, level)

    if (!_.isEmpty(joiSpec.metas)) {
      _.each(joiSpec.metas, meta => {
        _.each(meta, (value, key) => {
          if (key === 'deprecated' || key === 'readOnly' || key === 'writeOnly') {
            schema[key] = value
          }
        })
      })
    }

    return schema
  }
}

module.exports = JoiJsonDraftSchemaParser
