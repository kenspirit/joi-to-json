const joi = require('joi-17')
const Ajv = require('ajv/dist/2019')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.object({
  a: joi.string(),
  b: joi.number(),
  c: joi.boolean(),
  d: joi.number()
}).with('c', ['a']).with('d', ['a', 'b'])

const BASE_SCHEMA = {
  type: 'object',
  dependentRequired: {
    c: ['a'],
    d: ['a', 'b']
  },
  properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' }, d: { type: 'number' } },
  additionalProperties: false
}

test('with - checking property is not present', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ })
  expect(validate.errors).toBeFalsy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('with - no dependent properties exists when checking property is present', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ d: 1 })
  expect(validate.errors).toBeTruthy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('with - partial dependent properties exists when checking property is present', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ d: 1, a: '' })
  expect(validate.errors).toBeTruthy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('with - all dependent properties exists when checking property is present', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  validate({ d: 1, a: '', b: 1 })
  expect(validate.errors).toBeFalsy()
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})
