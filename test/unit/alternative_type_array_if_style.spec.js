const joi = require('joi')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.alternatives().conditional(
  joi.array().has(joi.any().valid(null)),
  {
    then: joi.array().max(1),
    otherwise: joi.array().max(3)
  }
)

const BASE_SCHEMA = {
  'if': { type: 'array', items: {}, 'contains': { 'const': null } },
  'then': { type: 'array', items: {}, 'maxItems': 1 },
  'else': { type: 'array', items: {}, 'maxItems': 3 }
}

const jsonSchema = parse(JOI_OBJ)
const validate = ajv.compile(jsonSchema, { allowUnionTypes: true })

test('alternative type array if style - valid schema', () => {
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('alternative type array if style - valid matching if', () => {
  const value = [null]
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternative type array if style - valid matching otherwise', () => {
  const value = [1, 2]
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternative type array if style - invalid matching if', () => {
  const value = [null, 1]
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})

test('alternative type array if style - invalid matching otherwise', () => {
  const value = [1, 2, 3, 4]
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})
