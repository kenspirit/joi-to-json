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
    const schema = _.pickBy(fullSchema, (value, key) => isKnownKey(key))

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

  _isKnownMetaKey(key) {
    return isKnownMetaKey(key)
  }
}

function isKnownMetaKey(key) {
  return key.startsWith('x-') || key === 'deprecated' || key === 'readOnly' || key === 'writeOnly'
}

function isKnownKey(key) {
  const knownKeys = new Set([
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
  return knownKeys.has(key) || isKnownMetaKey(key)
}

module.exports = JoiOpenApiSchemaParser