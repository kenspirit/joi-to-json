const _ = require('lodash')
const JoiJsonSchemaParser = require('./json')

class JoiJsonDraftSchemaParser extends JoiJsonSchemaParser {
  constructor(opts = {}) {
    super(_.merge({
      $schema: 'https://json-schema.org/draft/2019-09/schema'
    }, opts))
  }

  parse(joiSpec, definitions = {}, level = 0) {
    const schema = super.parse(joiSpec, definitions, level)

    if (!schema.$ref) {
      this._copyMetasToSchema(joiSpec, schema)
    }

    return schema
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

  _moveSchemaToDefinitions(schema, joiSpec, definitions, schemaId) {
    this._copyMetasToSchema(joiSpec, schema)
    definitions[schemaId] = schema
    return {
      $ref: `${this._getLocalSchemaBasePath()}/${schemaId}`
    }
  }
}

module.exports = JoiJsonDraftSchemaParser
