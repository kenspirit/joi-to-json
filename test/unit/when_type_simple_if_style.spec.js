const joi = require('joi-17')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.number().when(
  joi.number().multiple(10),
  {
    then: joi.number().max(100),
    otherwise: joi.number().max(9)
  }
)

const BASE_SCHEMA = {
  'type': 'number',
  'if': { 'multipleOf': 10, type: 'number' },
  'then': { 'maximum': 100, type: 'number' },
  'else': { 'maximum': 9, type: 'number' }
}

const jsonSchema = parse(JOI_OBJ)
const validate = ajv.compile(jsonSchema)

test('when type simple if style - valid schema', () => {
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('when type simple if style - valid matching if', () => {
  const value = 50
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('when type simple if style - valid matching otherwise', () => {
  const value = 8
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('when type simple if style - invalid matching if', () => {
  const value = 110
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})

test('when type simple if style - invalid matching otherwise', () => {
  const value = 19
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})
