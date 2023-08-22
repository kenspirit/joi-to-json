const Ajv = require('ajv')
const executeTests = require('./parser.base')

executeTests('json', new Ajv({ allErrors: true }))
