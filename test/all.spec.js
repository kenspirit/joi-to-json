const fs = require('fs')
const Validator = require('jsonschema').Validator
const convert = require('../index')
const expected = require('../fixtures/output.json')
const jsonSchemaDraft = require('../schemas/json-schema-draft04')

const v = new Validator()
v.addSchema(jsonSchemaDraft)

const files = fs.readdirSync('./fixtures')

files.forEach((file) => {
  if (file.indexOf(process.env.CASE_PATTERN || 'joi-obj-') === 0) {
    test(file, () => {
      const joiObj = require(`../fixtures/${file}`)
      const jsonSchema = convert(joiObj, process.env.DEBUG === 'true')
      expect(jsonSchema).toEqual(expected)

      // Safety net in case the expected output is not compatible to json schema
      const result = v.validate(jsonSchema, jsonSchemaDraft)
      expect(result.errors.length, JSON.stringify(result.errors, null, 2)).toBe(0)
    })
  }
})
