const joi = require('joi')
const Ajv = require('ajv')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.object().keys({
    gender: joi.string(),
    commonHeightRange: joi.alternatives().conditional('gender', {
      switch: [
        { is: 'Female', then: joi.number().greater(140).less(180) },
        { is: 'Male', then: joi.number().greater(150).less(200), otherwise: joi.number() }
      ]
    })
  })

const BASE_SCHEMA = {
  'type': 'object',
  'properties': {
    'gender': {
      'type': 'string'
    },
    'commonHeightRange': {
      'anyOf': [
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
        },
        {
          'type': 'number'
        }
      ]
    }
  },
  'additionalProperties': false
}

const jsonSchema = parse(JOI_OBJ)
const validate = ajv.compile(jsonSchema, { allowUnionTypes: true })

test('alternative ref switch - valid schema', () => {
  expect(jsonSchema).toEqual(BASE_SCHEMA)
})

test('alternative ref switch - valid', () => {
  const value = { commonHeightRange: 141, gender: 'Female' }
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternative ref switch - valid otherwise', () => {
  const value = { commonHeightRange: 0 }
  validate(value)
  expect(validate.errors).toBeFalsy()
  expect(JOI_OBJ.validate(value).error).toBeFalsy()
})

test('alternative ref switch - invalid', () => {
  const value = { commonHeightRange: false }
  validate(value)
  expect(validate.errors).toBeTruthy()
  expect(JOI_OBJ.validate(value).error).toBeTruthy()
})
