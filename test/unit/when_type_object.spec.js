const joi = require('joi')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.object().keys({
    dynamic: joi.any().allow(null)
  })
  .unknown(true)
  .when(
    joi.object().keys({
      dynamic: joi.string().valid('kc').required()
    }).unknown(true),
    {
      then: joi.object().keys({ number: joi.number() }).unknown(true),
      otherwise: joi.object().keys({
        mustHave: joi.boolean().required()
      })
    }
  ).meta({ 'if-style': false })

const BASE_SCHEMA = {
  type: 'object',
  properties: {
    dynamic: {
      type: [
        'array',
        'boolean',
        'number',
        'object',
        'string',
        'null'
      ]
    }
  },
  additionalProperties: true,
  allOf: [
    {
      anyOf: [
        {
          not: {
            type: 'object',
            properties: {
              dynamic: {
                'const': 'kc'
              }
            },
            required: [
              'dynamic'
            ],
            additionalProperties: true
          }
        },
        {
          type: 'object',
          properties: {
            number: {
              type: 'number'
            }
          },
          additionalProperties: true
        }
      ]
    },
    {
      anyOf: [
        {
          type: 'object',
          properties: {
            dynamic: {
              'const': 'kc'
            }
          },
          required: [
            'dynamic'
          ],
          additionalProperties: true
        },
        {
          type: 'object',
          properties: {
            mustHave: {
              type: 'boolean'
            }
          },
          required: [
            'mustHave'
          ],
          additionalProperties: false
        }
      ]
    }
  ]
}

const jsonSchema = parse(JOI_OBJ)
const validate = ajv.compile(jsonSchema, { allowUnionTypes: true })

test('when type object - valid schema', () => {
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('when type object - valid matching if', () => {
  const value = { dynamic: 'kc', anything: true }
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('when type object - valid matching otherwise', () => {
  const value = { mustHave: true }
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('when type object - invalid matching any', () => {
  const value = { something: false }
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})
