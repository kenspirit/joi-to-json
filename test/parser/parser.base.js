const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const Ajv = require('ajv')

function executeTests(outputType, ajv = new Ajv({ allErrors: true })) {
  const Parser = require(`../../lib/parsers/${outputType}`)
  const parser = new Parser()
  const joiTypeInputs = fs.readdirSync(path.resolve(__dirname, '../../outputs-baseline'))

  joiTypeInputs.forEach((joiType) => {
    const parserCaseInputs = fs.readdirSync(path.resolve(__dirname, `../../outputs-baseline/${joiType}`))

    parserCaseInputs.forEach((joiCase) => {
      if (process.env.TEST_CASE && !process.env.TEST_CASE.split(',').includes(joiCase.replace('.json', ''))) {
        return
      }

      if (!fs.existsSync(path.resolve(__dirname, `../../outputs-parsers/${outputType}/${joiType}/${joiCase}`))) {
        return
      }

      test(`${outputType} schema parsing - ${joiType} - ${joiCase} `, () => {
        const expected = require(path.resolve(__dirname, `../../outputs-parsers/${outputType}/${joiType}/${joiCase}`))
        const joiObj = require(path.resolve(__dirname, `../../outputs-baseline/${joiType}/${joiCase}`))
        const destSchema = parser.parse(joiObj, {})

        // Safety net in case the expected output is not compatible to json schema
        const validationResult = ajv.validateSchema(destSchema)
        if (!validationResult) {
          console.error(`${outputType} schema validation failed on case: ${joiType} - ${joiCase}`, JSON.stringify(ajv.errors, null, 2))
        }
        expect(validationResult).toBeTruthy()

        expect(destSchema).toEqual(expected)
      })
    })
  })
}

module.exports = executeTests
