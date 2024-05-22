const _ = require('lodash')
const JoiJsonSchemaParser = require('./json-draft-04')

class JoiOpenApiSchemaParser extends JoiJsonSchemaParser {
  constructor(opts = {}) {
    super(_.merge({
      logicalOpParser: {
        xor: null,
        with: null,
        without: null
      }
    }, opts))

    this.$schema = undefined
  }

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

    if (!schema.$ref) {
      this._copyMetasToSchema(joiSpec, schema)
    }

    if (level === 0 && !_.isEmpty(definitions)) {
      schema.schemas = definitions
    }

    if (fullSchema.const) {
      schema.enum = [fullSchema.const]
    }

    return schema
  }

  _isIfThenElseSupported() {
    return false
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
    super._addNullTypeIfNullable(fieldSchema, fieldDefn)

    if (fieldSchema.type === 'null') {
      delete fieldSchema.type
      fieldSchema.nullable = true
    } else if (_.isArray(fieldSchema.type) && fieldSchema.type.includes('null')) {
      _.remove(fieldSchema.type, (i) => {
        return i === 'null'
      })
      fieldSchema.nullable = true

      if (fieldSchema.type.length === 1) {
        fieldSchema.type = fieldSchema.type[0]
      }
    }

    if (_.isArray(fieldSchema.type)) {
      // anyOf might exist for When / Alternative case
      fieldSchema.anyOf = fieldSchema.anyOf || []

      _.forEach(fieldSchema.type, (t) => {
        const typeExisted = _.some(fieldSchema.anyOf, (condition) => {
          return condition.type === t
        })

        if (!typeExisted) {
          const def = { type: t }
          if (t === 'array') {
            def.items = {}
          }
          fieldSchema.anyOf.push(def)
        }
      })

      delete fieldSchema.type
    }
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

  _moveSchemaToDefinitions(schema, joiSpec, definitions, schemaId) {
    this._copyMetasToSchema(joiSpec, schema)
    definitions[schemaId] = schema
    return {
      $ref: `${this._getLocalSchemaBasePath()}/${schemaId}`
    }
  }
}

module.exports = JoiOpenApiSchemaParser
