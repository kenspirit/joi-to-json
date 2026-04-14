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
    this.knownKeys = [
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
    ]
  }

  parse(joiSpec, definitions = {}, level = 0) {
    const schema = super.parse(joiSpec, definitions, level)

    if (level === 0 && !_.isEmpty(definitions)) {
      schema.schemas = definitions
    }
    delete schema.components

    if (schema.const) {
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
      delete fieldSchema.examples
    }
  }

  _addNullTypeIfNullable(fieldSchema, fieldDefn) {
    super._addNullTypeIfNullable(fieldSchema, fieldDefn)

    if (fieldSchema.type === 'null') {
      // OpenAPI 3.0 does not support type with value 'null', so we need to set type to 'object' and nullable to true
      fieldSchema.type = 'object'
      fieldSchema.nullable = true
    } else if (_.isArray(fieldSchema.type) && fieldSchema.type.includes('null')) {
      _.remove(fieldSchema.type, (i) => {
        return i === 'null'
      })
      fieldSchema.nullable = true

      if (fieldSchema.type.length === 1) {
        fieldSchema.type = fieldSchema.type[0]
      } else if (!fieldSchema.type) {
        // if the only type is null, we need to set type to object because open-api 3.0 does not support type with value 'null'
        fieldSchema.type = 'object'
      }
    }

    if (_.isArray(fieldSchema.type)) {
      // anyOf is used for When / Alternative case because open-api 3.0 does not support type with array value
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

      _.forEach(fieldSchema.anyOf, (condition) => {
        if (fieldSchema.nullable) {
          condition.nullable = true
        }
      })

      delete fieldSchema.type
      delete fieldSchema.nullable
    }
  }

  _isKnownMetaKey(key) {
    return key.startsWith('x-') || key === 'deprecated' || key === 'readOnly' || key === 'writeOnly'
  }
}

module.exports = JoiOpenApiSchemaParser
