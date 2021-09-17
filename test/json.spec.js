const Ajv = require('ajv')
const executeTests = require('./base')

executeTests('json', new Ajv({ allErrors: true }))
