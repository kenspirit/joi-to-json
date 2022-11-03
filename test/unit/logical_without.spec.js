const joi = require('joi-17')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.object({
  a: joi.string(),
  b: joi.number(),
  c: joi.boolean(),
  d: joi.number()
}).without('a', ['b', 'c'])

const BASE_SCHEMA = {
  type: 'object',
  if: { required: ['a'] },
  then: {
    not: {
      anyOf: [{ required: ['b'] }, { required: ['c'] }]
    }
  },
  properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' }, d: { type: 'number' } },
  additionalProperties: false
}

test('without - checking property is not present', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ b: 1, c: true })
  expect(validate.errors).toBeFalsy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('without - no dependent properties exists when checking property is present', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ a: '' })
  expect(validate.errors).toBeFalsy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('without - dependent property exists when checking property is present', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ a: '', b: 1 })
  expect(validate.errors).toBeTruthy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})
