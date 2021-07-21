const _ = require('lodash')
const fs = require('fs')
const Validator = require('jsonschema').Validator
const convert = require('../index')
const jsonSchemaDraft = require('../schemas/json-schema-draft04')

const v = new Validator()
v.addSchema(jsonSchemaDraft)

const isDebug = process.env.DEBUG === 'true'
const outputs = fs.readdirSync('./outputs')
const outputMap = _.reduce(outputs, (map, filename) => {
  const name = filename.replace('.json', '')
  map[name] = require(`../outputs/${filename}`)
  return map
}, {})

const files = fs.readdirSync('./fixtures')

files.forEach((file) => {
  if (file.indexOf(process.env.CASE_PATTERN || 'joi-obj-') === 0) {
    test(file, () => {
      const joiObj = require(`../fixtures/${file}`)
      const jsonSchema = convert(joiObj, isDebug)
      if (isDebug) {
        console.debug(`Converted schema for fixture ${file}`, JSON.stringify(jsonSchema, null, 2))
      }
      let expected = outputMap[file.replace('.js', '')]
      if (!expected) {
        expected = outputMap.base
      }

      expect(jsonSchema).toEqual(expected)

      // Safety net in case the expected output is not compatible to json schema
      const result = v.validate(jsonSchema, jsonSchemaDraft)
      expect(result.errors.length, JSON.stringify(result.errors, null, 2)).toBe(0)
    })
  }
})
