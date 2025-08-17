const joi = require('joi')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.object().keys({
  key: joi.string(),
  another: joi.string()
}).unknown()
.when(joi.object().keys({ key: joi.string().valid('xxx') }).unknown(),
  { then: joi.object().keys({ key1: joi.string().required() }).unknown() }
).when(joi.object().keys({ key: joi.string().valid('yyy') }).unknown(),
  { then: joi.object().keys({ key2: joi.string().required() }).unknown() }
).when(joi.object().keys({ another: joi.string().valid('zzz') }).unknown(),
  { then: joi.object().keys({ key3: joi.string().required() }).unknown() }
)

const BASE_SCHEMA = {
  'type': 'object',
  'properties': {
    'key': {
      'type': 'string'
    },
    'another': {
      'type': 'string'
    }
  },
  additionalProperties: true,
  allOf: [
    {
      if: {
        type: 'object',
        properties: { key: { const: 'xxx' } },
        additionalProperties: true
      },
      then: {
        type: 'object',
        required: ['key1'],
        properties: { key1: { type: 'string' } },
        additionalProperties: true
      }
    },
    {
      if: {
        type: 'object',
        properties: { key: { const: 'yyy' } },
        additionalProperties: true
      },
      then: {
        type: 'object',
        required: ['key2'],
        properties: { key2: { type: 'string' } },
        additionalProperties: true
      }
    },
    {
      if: {
        type: 'object',
        properties: { another: { const: 'zzz' } },
        additionalProperties: true
      },
      then: {
        type: 'object',
        required: ['key3'],
        properties: { key3: { type: 'string' } },
        additionalProperties: true
      }
    }
  ]
}

const jsonSchema = parse(JOI_OBJ)
const validate = ajv.compile(jsonSchema, { allowUnionTypes: true })

test('when multiple if style - valid schema', () => {
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('when multiple if style - valid matching all of the condition', () => {
  const value = { key: 'xxx', key1: 'kc', another: 'zzz', key3: 'ws' }
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('when multiple if style - valid matching one of the condition', () => {
  const value = { key: 'yyy', key2: 'kc' }
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})

test('when multiple if style - invalid matching one of the condition', () => {
  const value = { key: 'xxx' }
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})

test('when multiple if style - invalid matching none', () => {
  const value = { something: false }
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})
