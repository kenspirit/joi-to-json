const joi = require('joi-17')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.object({
  a: joi.string(),
  b: joi.number(),
  c: joi.boolean(),
  d: joi.number()
}).and('a', 'b', 'c')

const BASE_SCHEMA = {
  type: 'object',
  oneOf: [
    { required: ['a', 'b', 'c'] },
    {
      allOf: [
        {
          not: { required: ['a'] }
        },
        {
          not: { required: ['b'] }
        },
        {
          not: { required: ['c'] }
        }
      ]
    }
  ],
  properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' }, d: { type: 'number' } },
  additionalProperties: false
}

test('and - none exists', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ })
  expect(validate.errors).toBeFalsy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('and - none exists with unknown field allown', () => {
  const joiObj = JOI_OBJ.unknown(true)
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ e: 1 })
  expect(validate.errors).toBeFalsy()
  expect(jsonSchema).toEqual(Object.assign({ }, BASE_SCHEMA, { additionalProperties: true }))
})

test('and - all exists', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ a: 'hi', b: 1, c: true })
  expect(validate.errors).toBeFalsy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('and - all exists with unknown field allown', () => {
  const joiObj = JOI_OBJ.unknown(true)
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ a: 'hi', b: 1, c: true, e: 1 })
  expect(validate.errors).toBeFalsy()
  expect(jsonSchema).toEqual(Object.assign({ }, BASE_SCHEMA, { additionalProperties: true }))
})

test('and - some exists', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ a: '' })
  expect(validate.errors).toBeTruthy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('and - some exists with unknown field allown', () => {
  const joiObj = JOI_OBJ.unknown(true)
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ a: '', e: 1 })
  expect(validate.errors).toBeTruthy()
  expect(jsonSchema).toEqual(Object.assign({ }, BASE_SCHEMA, { additionalProperties: true }))
})
