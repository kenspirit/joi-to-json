const Ajv = require('ajv-draft-04')
const executeTests = require('./parser.base')

executeTests('json-draft-04', new Ajv())
