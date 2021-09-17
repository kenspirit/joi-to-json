const _ = require('lodash')
const JoiJsonSchemaParser = require('./json')

class JoiOpenApiSchemaParser extends JoiJsonSchemaParser {
  parse(joiSpec) {
    const schema = super.parse(joiSpec)

    if (!_.isEmpty(joiSpec.metas)) {
      _.each(joiSpec.metas, meta => {
        _.each(meta, (value, key) => {
          if (key === 'deprecated') {
            schema[key] = value
          }
        })
      })
    }

    return schema
  }
}

module.exports = JoiOpenApiSchemaParser
