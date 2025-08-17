const joi = require('joi')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.object({
  a: joi.string(),
  b: joi.number(),
  c: joi.boolean(),
  d: joi.number()
}).xor('a', 'b', 'c')

const BASE_SCHEMA = {
  type: 'object',
  properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' }, d: { type: 'number' } },
  if: { propertyNames: { enum: ['a', 'b', 'c'] }, minProperties: 2 },
  then: false,
  else: {
    oneOf: [
      {
        required: ['a']
      },
      {
        required: ['b']
      },
      {
        required: ['c']
      }
    ]
  },
  additionalProperties: false
}

test('xor - single field', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ a: 'hi' })
  expect(validate.errors).toBeFalsy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('xor - single field with unknown field allown', () => {
  const joiObj = JOI_OBJ.unknown(true)
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ a: 'hi', e: 1 })
  expect(validate.errors).toBeFalsy()
  expect(jsonSchema).toEqual(Object.assign({ }, BASE_SCHEMA, { additionalProperties: true }))
})

test('xor - multiple fields', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ a: 'hi', b: 1 })
  expect(validate.errors).toBeTruthy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('xor - multiple fields with unknown field allown', () => {
  const joiObj = JOI_OBJ.unknown(true)
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ a: 'hi', b: 1, e: 1 })
  expect(validate.errors).toBeTruthy()
  expect(jsonSchema).toEqual(Object.assign({ }, BASE_SCHEMA, { additionalProperties: true }))
})

test('xor - missing field', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ })
  expect(validate.errors).toBeTruthy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('xor - missing field with unknown field allown', () => {
  const joiObj = JOI_OBJ.unknown(true)
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ e: 1 })
  expect(validate.errors).toBeTruthy()
  expect(jsonSchema).toEqual(Object.assign({ }, BASE_SCHEMA, { additionalProperties: true }))
})
