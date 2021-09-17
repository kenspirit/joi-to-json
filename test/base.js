const _ = require('lodash')
const fs = require('fs')
const Ajv = require('ajv')
const parse = require('../index')

function executeTests(outputType, ajv = new Ajv({ allErrors: true })) {
  const outputs = fs.readdirSync(`./outputs/${outputType}`)
  const outputMap = _.reduce(outputs, (map, filename) => {
    const name = filename.replace('.json', '')
    map[name] = require(`../outputs/${outputType}/${filename}`)
    return map
  }, {})

  const files = fs.readdirSync('./fixtures')

  files.forEach((file) => {
    if (file.indexOf(process.env.CASE_PATTERN || 'joi-obj-') === 0) {
      test(`${outputType} schema parsing - ${file} `, () => {
        const joiObj = require(`../fixtures/${file}`)
        const destSchema = parse(joiObj, outputType)

        let expected = outputMap[file.replace('.js', '')]
        if (!expected) {
          expected = outputMap.base
        }

        expect(destSchema).toEqual(expected)

        // Safety net in case the expected output is not compatible to json schema
        const validationResult = ajv.validateSchema(destSchema)
        if (!validationResult) {
          console.error(JSON.stringify(ajv.errors, null, 2))
        }
        expect(validationResult).toBeTruthy()
      })
    }
  })
}

module.exports = executeTests
