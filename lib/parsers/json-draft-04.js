const _ = require('lodash')
const JoiJsonSchemaParser = require('./json')

class JoiJsonDraftSchemaParser extends JoiJsonSchemaParser {
  constructor(opts = {}) {
    super(_.merge({
      $schema: 'http://json-schema.org/draft-04/schema#',
      logicalOpParser: {
        xor: null,
        with: function (schema, dependency) {
          schema.dependencies = schema.dependencies || {}
          schema.dependencies[dependency.key] = dependency.peers
        },
        without: null
      }
    }, opts))
  }

  _isIfThenElseSupported() {
    return false
  }

  _setNumberFieldProperties(fieldSchema, fieldDefn) {
    super._setNumberFieldProperties(fieldSchema, fieldDefn)

    if (typeof fieldSchema.exclusiveMinimum !== 'undefined') {
      fieldSchema.minimum = fieldSchema.exclusiveMinimum
      fieldSchema.exclusiveMinimum = true
    }
    if (typeof fieldSchema.exclusiveMaximum !== 'undefined') {
      fieldSchema.maximum = fieldSchema.exclusiveMaximum
      fieldSchema.exclusiveMaximum = true
    }

    if (typeof fieldSchema.minimum !== 'undefined' && fieldSchema.minimum === fieldSchema.exclusiveMinimum) {
      fieldSchema.exclusiveMinimum = true
    }
    if (typeof fieldSchema.maximum !== 'undefined' && fieldSchema.maximum === fieldSchema.exclusiveMaximum) {
      fieldSchema.exclusiveMaximum = true
    }
  }

  _getLocalSchemaBasePath() {
    return '#/definitions'
  }

  _setArrayFieldProperties(fieldSchema, fieldDefn, definitions, level) {
    super._setArrayFieldProperties(fieldSchema, fieldDefn, definitions, level)

    delete fieldSchema.contains
  }

  _setConst(fieldSchema, fieldDefn) {
    super._setConst(fieldSchema, fieldDefn)

    if (typeof fieldSchema.const !== 'undefined') {
      if (fieldSchema.const === null) {
        fieldSchema.type = 'null'
      } else if (_.isArray(fieldSchema.const)) {
        fieldSchema.type = 'array'
      } else {
        // boolean / number / string / object
        fieldSchema.type = typeof fieldSchema.const
        if (fieldSchema.type === 'number' && Number.isInteger(fieldSchema.const)) {
          fieldSchema.type = 'integer'
        }
      }
      fieldSchema.enum = [fieldSchema.const]
      delete fieldSchema.const
    }
  }
}

module.exports = JoiJsonDraftSchemaParser
