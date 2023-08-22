const joi = require('joi-17')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.alternatives().try(joi.number())

const BASE_SCHEMA = { type: 'number' }

const jsonSchema = parse(JOI_OBJ)
const validate = ajv.compile(jsonSchema)

test('alternative try with only one option - valid schema', () => {
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('alternative try with only one option - valid matching one', () => {
  const value = 50
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternative try with only one option - invalid matching none', () => {
  const value = true
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})

