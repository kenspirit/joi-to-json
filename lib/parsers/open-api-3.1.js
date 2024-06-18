const _ = require('lodash')
const JoiJsonSchemaParser = require('./json-draft-2019-09')

class JoiOpenApiSchemaParser extends JoiJsonSchemaParser {
  constructor(opts = {}) {
    super(opts)

    this.$schema = undefined
  }

  parse(joiSpec, definitions = {}, level = 0) {
    const schema = super.parse(joiSpec, definitions, level)

    if (level === 0 && !_.isEmpty(definitions)) {
      schema.schemas = definitions
    }
    delete schema.components

    return schema
  }

  _getLocalSchemaBasePath() {
    return '#/components/schemas'
  }

  _copyMetasToSchema(joiSpec, schema) {
    if (!_.isEmpty(joiSpec.metas)) {
      _.each(joiSpec.metas, meta => {
        _.each(meta, (value, key) => {
          if (key.startsWith('x-') || key === 'deprecated' || key === 'readOnly' || key === 'writeOnly') {
            schema[key] = value
          }
        })
      })
    }
  }
}

module.exports = JoiOpenApiSchemaParser
