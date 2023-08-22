const Ajv = require('ajv/dist/2019')
const executeTests = require('./parser.base')

executeTests('json-draft-2019-09', new Ajv({ allErrors: true }))
