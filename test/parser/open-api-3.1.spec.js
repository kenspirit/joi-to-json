const Ajv = require('ajv/dist/2020')
const executeTests = require('./parser.base')

const ajv = new Ajv({ allErrors: true })
ajv.addMetaSchema(require('../../schemas/openapi-3.1/meta/base.schema.json'))
ajv.addMetaSchema(require('../../schemas/openapi-3.1/dialect/base.schema.json'))
ajv.addMetaSchema(require('../../schemas/openapi-3.1/schema-base.json'))
ajv.addMetaSchema(require('../../schemas/openapi-3.1/schema.json'))
executeTests('open-api-3.1', ajv)
