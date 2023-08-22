const joi = require('joi-17')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.alternatives().try(joi.number(), joi.string()).match('one')

const BASE_SCHEMA = {
  oneOf: [
    { type: 'number' },
    { type: 'string' }
  ]
}

const jsonSchema = parse(JOI_OBJ)
const validate = ajv.compile(jsonSchema)

test('alternative try one - valid schema', () => {
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('alternative try one - valid matching one', () => {
  const value = 50
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternative try one - valid matching one 2', () => {
  const value = 'kc'
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternative try one - invalid matching none', () => {
  const value = true
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})

