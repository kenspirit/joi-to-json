const Ajv = require('ajv-draft-04')
const executeTests = require('./parser.base')

const ajv = new Ajv()
ajv.addMetaSchema(require('../../schemas/openapi-3.0.json'))
executeTests('open-api', ajv)
