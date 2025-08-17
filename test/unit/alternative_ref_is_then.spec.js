const joi = require('joi')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.object().keys({
  gender: joi.string(),
  commonHeightRange: joi.alternatives().conditional('gender', {
    is: 'Female',
    then: joi.number().greater(140).less(180),
    otherwise: joi.number().greater(150).less(200)
  })
})

const BASE_SCHEMA = {
  'type': 'object',
  'properties': {
    'gender': {
      'type': 'string'
    },
    'commonHeightRange': {
      'oneOf': [
        {
          'type': 'number',
          'exclusiveMinimum': 140,
          'minimum': 140,
          'exclusiveMaximum': 180,
          'maximum': 180
        },
        {
          'type': 'number',
          'exclusiveMinimum': 150,
          'minimum': 150,
          'exclusiveMaximum': 200,
          'maximum': 200
        }
      ]
    }
  },
  'additionalProperties': false
}

const jsonSchema = parse(JOI_OBJ)
const validate = ajv.compile(jsonSchema, { allowUnionTypes: true })

test('alternative ref is then - valid schema', () => {
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('alternative ref is then - valid', () => {
  const value = { commonHeightRange: 141, gender: 'Female' }
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternative ref is then - invalid', () => {
  const value = { commonHeightRange: false }
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})
