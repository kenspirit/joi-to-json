const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const Ajv = require('ajv')

function executeTests(outputType, ajv = new Ajv({ allErrors: true })) {
  const Parser = require(`../../lib/parsers/${outputType}`)
  const parser = new Parser()
  const joiTypeInputs = fs.readdirSync(path.resolve(__dirname, '../../outputs-conversion'))

  joiTypeInputs.forEach((joiType) => {
    const parserCaseInputs = fs.readdirSync(path.resolve(__dirname, `../../outputs-conversion/${joiType}`))

    parserCaseInputs.forEach((joiCase) => {
      if (process.env.TEST_CASE && !process.env.TEST_CASE.split(',').includes(joiCase.replace('.json', ''))) {
        return
      }

      if (!fs.existsSync(path.resolve(__dirname, `../../outputs-parsers/${outputType}/${joiType}/${joiCase}`))) {
        return
      }

      test(`${outputType} schema parsing - ${joiType} - ${joiCase} `, () => {
        const expected = require(path.resolve(__dirname, `../../outputs-parsers/${outputType}/${joiType}/${joiCase}`))
        const joiObj = require(path.resolve(__dirname, `../../outputs-conversion/${joiType}/${joiCase}`))
        const destSchema = parser.parse(joiObj, {})

        // Can write the expected result (Should be the latest convertor version as baseline)
        if (process.env.TEST_UPDATE_PARSER_BASELINE === 'true') {
          fs.writeFileSync(
            path.resolve(__dirname, `../outputs-parsers/${outputType}/${joiType}/${joiCase}`),
            JSON.stringify(destSchema, null, 2)
          )
        }
        expect(destSchema).toEqual(expected)

        // Safety net in case the expected output is not compatible to json schema
        const validationResult = ajv.validateSchema(destSchema)
        if (!validationResult) {
          console.error(`${outputType} schema validation failed on case: ${joiType} - ${joiCase}`, JSON.stringify(ajv.errors, null, 2))
        }
        expect(validationResult).toBeTruthy()
      })
    })
  })
}

module.exports = executeTests
