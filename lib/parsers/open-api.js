const _ = require('lodash')
const JoiJsonSchemaParser = require('./json-draft-04')

class JoiOpenApiSchemaParser extends JoiJsonSchemaParser {
  parse(joiSpec, definitions = {}, level = 0) {
    const fullSchema = super.parse(joiSpec, definitions, level)
    const schema = _.pick(fullSchema, [
      '$ref',
      'title',
      'multipleOf',
      'maximum',
      'exclusiveMaximum',
      'minimum',
      'exclusiveMinimum',
      'maxLength',
      'minLength',
      'pattern',
      'maxItems',
      'minItems',
      'uniqueItems',
      'maxProperties',
      'minProperties',
      'required',
      'enum',
      'description',
      'format',
      'default',
      'type',

      'allOf',
      'oneOf',
      'anyOf',
      'not',
      'items',
      'properties',
      'additionalProperties',

      'example',
      'nullable'
    ])

    if (!_.isEmpty(joiSpec.metas)) {
      _.each(joiSpec.metas, meta => {
        _.each(meta, (value, key) => {
          if (key.startsWith('x-') || key === 'deprecated' || key === 'readOnly' || key === 'writeOnly') {
            schema[key] = value
          }
        })
      })
    }

    if (level === 0 && !_.isEmpty(definitions)) {
      schema.schemas = definitions
    }

    if (fullSchema.const) {
      schema.enum = [fullSchema.const]
    }

    return schema
  }

  _getLocalSchemaBasePath() {
    return '#/components/schemas'
  }

  _setBasicProperties(fieldSchema, fieldDefn) {
    super._setBasicProperties(fieldSchema, fieldDefn)

    if (!_.isEmpty(fieldSchema.examples)) {
      fieldSchema.example = fieldSchema.examples[0]
    }
  }

  _addNullTypeIfNullable(fieldSchema, fieldDefn) {
    const enums = _.get(fieldDefn, this.enumFieldName)
    if (Array.isArray(enums) && enums.includes(null)) {
      fieldSchema.nullable = true
    }
  }
}

module.exports = JoiOpenApiSchemaParser
