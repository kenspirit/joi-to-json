const _ = require('lodash')
const fs = require('fs')
const Validator = require('jsonschema').Validator
const parse = require('../index')

function executeTests(outputType, jsonSchema) {
  const v = new Validator()

  if (!!jsonSchema) {
    v.addSchema(jsonSchema)
  }

  const outputs = fs.readdirSync(`./outputs/${outputType}`)
  const outputMap = _.reduce(outputs, (map, filename) => {
    const name = filename.replace('.json', '')
    map[name] = require(`../outputs/${outputType}/${filename}`)
    return map
  }, {})

  const files = fs.readdirSync('./fixtures')

  files.forEach((file) => {
    if (file.indexOf(process.env.CASE_PATTERN || 'joi-obj-') === 0) {
      test(`JSON Schema Parsing - ${file} `, () => {
        const joiObj = require(`../fixtures/${file}`)
        const destSchema = parse(joiObj, outputType)

        let expected = outputMap[file.replace('.js', '')]
        if (!expected) {
          expected = outputMap.base
        }

        expect(destSchema).toEqual(expected)

        // Safety net in case the expected output is not compatible to json schema
        if (!!jsonSchema) {
          const result = v.validate(destSchema, jsonSchema)
          if (result.errors.length > 0) {
            console.error(JSON.stringify(result.errors, null, 2))
          }
          expect(result.errors.length).toBe(0)
        }
      })
    }
  })
}

module.exports = executeTests
