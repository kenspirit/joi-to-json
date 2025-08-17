const joi = require('joi')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.alternatives().conditional(
  joi.object().keys({
    dynamic: joi.string().valid('kc').required()
  }).unknown(true),
  {
    then: joi.object().keys({ number: joi.number() }).unknown(true),
    otherwise: joi.object().keys({
      mustHave: joi.boolean().required()
    })
  }
)

const BASE_SCHEMA = {
  if: {
    type: 'object',
    required: ['dynamic'],
    properties: { dynamic: { const: 'kc' } },
    additionalProperties: true
  },
  then: {
    type: 'object',
    properties: { number: { type: 'number' } },
    additionalProperties: true
  },
  else: {
    type: 'object',
    required: ['mustHave'],
    properties: { mustHave: { type: 'boolean' } },
    additionalProperties: false
  }
}

const jsonSchema = parse(JOI_OBJ)
const validate = ajv.compile(jsonSchema, { allowUnionTypes: true })

test('alternative type object if style - valid schema', () => {
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('alternative type object if style - valid matching if', () => {
  const value = { dynamic: 'kc', anything: true }
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternative type object if style - valid matching otherwise', () => {
  const value = { mustHave: true }
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternative type object if style - invalid matching any', () => {
  const value = { something: false }
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})
