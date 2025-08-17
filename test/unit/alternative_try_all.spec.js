const joi = require('joi')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.alternatives().try(
  joi.number().greater(100),
  joi.number().less(200)
).match('all')

const BASE_SCHEMA = {
  allOf: [
    { type: 'number', minimum: 100, exclusiveMinimum: 100 },
    { type: 'number', maximum: 200, exclusiveMaximum: 200 }
  ]
}

const jsonSchema = parse(JOI_OBJ)
const validate = ajv.compile(jsonSchema)

test('alternative try all - valid schema', () => {
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('alternative try all - valid matching both', () => {
  const value = 150
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternative try all - invalid matching one', () => {
  const value = 300
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})

test('alternative try all - invalid matching one 2', () => {
  const value = 80
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})

test('alternative try all - invalid matching none', () => {
  const value = true
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})

