const joi = require('joi-17')
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
).meta({ 'if-style': false })

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
  'additionalProperties': true,
  'allOf': [
    {
      'anyOf': [
        {
          not: {
            'type': 'object',
            'properties': {
              'key': {
                'const': 'xxx'
              }
            },
            'additionalProperties': true
          }
        },
        {
          'type': 'object',
          'properties': {
            'key1': {
              'type': 'string'
            }
          },
          'required': [
            'key1'
          ],
          'additionalProperties': true
        }
      ]
    },
    {
      'anyOf': [
        {
          not: {
            'type': 'object',
            'properties': {
              'key': {
                'const': 'yyy'
              }
            },
            'additionalProperties': true
          }
        },
        {
          'type': 'object',
          'properties': {
            'key2': {
              'type': 'string'
            }
          },
          'required': [
            'key2'
          ],
          'additionalProperties': true
        }
      ]
    },
    {
      'anyOf': [
        {
          not: {
            'type': 'object',
            'properties': {
              'another': {
                'const': 'zzz'
              }
            },
            'additionalProperties': true
          }
        },
        {
          'type': 'object',
          'properties': {
            'key3': {
              'type': 'string'
            }
          },
          'required': [
            'key3'
          ],
          'additionalProperties': true
        }
      ]
    }
  ]
}

const jsonSchema = parse(JOI_OBJ)
const validate = ajv.compile(jsonSchema, { allowUnionTypes: true })

test('when multiple - valid schema', () => {
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('when multiple - valid matching all of the condition', () => {
  const value = { key: 'xxx', key1: 'kc', another: 'zzz', key3: 'ws' }
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('when multiple - valid matching one of the condition', () => {
  const value = { key: 'yyy', key2: 'kc' }
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})

test('when multiple - invalid matching one of the condition', () => {
  const value = { key: 'xxx' }
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})

test('when multiple - invalid matching none', () => {
  const value = { something: false }
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})
