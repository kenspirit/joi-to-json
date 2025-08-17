const joi = require('joi')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.alternatives().conditional(
  joi.number().multiple(10),
  {
    then: joi.number().max(100),
    otherwise: joi.number().max(9)
  }
).meta({ 'if-style': false })

const BASE_SCHEMA = {
  allOf: [
    {
      anyOf: [
        { not: { type: 'number', 'multipleOf': 10 } },
        { type: 'number', 'maximum': 100 }
      ]
    },
    {
      anyOf: [
        { type: 'number', 'multipleOf': 10 },
        { 'maximum': 9, type: 'number' }
      ]
    }
  ]
}

const jsonSchema = parse(JOI_OBJ)
const validate = ajv.compile(jsonSchema)

test('alternatives type simple - valid schema', () => {
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('alternatives type simple - valid matching if', () => {
  const value = 50
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternatives type simple - valid matching otherwise', () => {
  const value = 8
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternatives type simple - invalid matching if', () => {
  const value = 110
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})

test('alternatives type simple - invalid matching otherwise', () => {
  const value = 19
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})
