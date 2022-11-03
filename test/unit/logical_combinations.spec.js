const _ = require('lodash')
const joi = require('joi-17')
const Ajv = require('ajv/dist/2019')
const parse = require('../../index')

const ajv = new Ajv({ allErrors: true })

const JOI_OBJ = joi.object({
  guid: joi.string(),
  uuid: joi.string(),
  email: joi.string(),
  password: joi.string(),
  type: joi.string(),
  birthTime: joi.string(),
  birthday: joi.string(),
  readOnlyTrue: joi.string(),
  readOnlyFalse: joi.string(),
  writeOnlyTrue: joi.string(),
  writeOnlyFalse: joi.string(),
  genderSpecific: joi.string(),
  maleSpecific: joi.string(),
  ip: joi.string(),
  hostname: joi.string(),
  isAdditional: joi.boolean()
}).or('guid', 'uuid')
  .and('email', 'password', 'type')
  .nand('readOnlyTrue', 'readOnlyFalse')
  .xor('genderSpecific', 'maleSpecific')
  .oxor('ip', 'hostname')
  .with('birthTime', ['birthday'])
  .without('readOnlyTrue', ['writeOnlyTrue', 'writeOnlyFalse'])

const BASE_SCHEMA = {
  'type': 'object',
  'properties': {
    'guid': { 'type': 'string' },
    'uuid': { 'type': 'string' },
    'email': { 'type': 'string' },
    'password': { 'type': 'string' },
    'type': { 'type': 'string' },
    'birthTime': { 'type': 'string' },
    'birthday': { 'type': 'string' },
    'readOnlyTrue': { 'type': 'string' },
    'readOnlyFalse': { 'type': 'string' },
    'writeOnlyTrue': { 'type': 'string' },
    'writeOnlyFalse': { 'type': 'string' },
    'genderSpecific': { 'type': 'string' },
    'maleSpecific': { 'type': 'string' },
    'ip': { 'type': 'string' },
    'hostname': { 'type': 'string' },
    'isAdditional': { 'type': 'boolean' }
  },
  'additionalProperties': false,
  'dependentRequired': {
    'birthTime': [
      'birthday'
    ]
  },
  'allOf': [
    {
      'anyOf': [
        { 'required': ['guid' ] },
        { 'required': ['uuid'] }
      ]
    },
    {
      'oneOf': [
        {
          'required': ['email', 'password', 'type' ]
        },
        {
          'allOf': [
            {
              'not': { 'required': ['email'] }
            },
            {
              'not': { 'required': ['password'] }
            },
            {
              'not': { 'required': ['type'] }
            }
          ]
        }
      ]
    },
    {
      'not': { 'required': ['readOnlyTrue', 'readOnlyFalse'] }
    },
    {
      'if': {
        'propertyNames': {
          'enum': ['genderSpecific', 'maleSpecific']
        },
        'minProperties': 2
      },
      'then': false,
      'else': {
        'oneOf': [
          { 'required': ['genderSpecific'] },
          { 'required': ['maleSpecific'] }
        ]
      }
    },
    {
      'oneOf': [
        { 'required': ['ip'] },
        { 'required': ['hostname'] },
        {
          'not': {
            'oneOf': [
              { 'required': ['ip'] },
              { 'required': ['hostname'] },
              { 'required': ['ip', 'hostname'] }
            ]
          }
        }
      ]
    },
    {
      'if': {
        'required': [
          'readOnlyTrue'
        ]
      },
      'then': {
        'not': {
          'anyOf': [
            {
              'required': [
                'writeOnlyTrue'
              ]
            },
            {
              'required': [
                'writeOnlyFalse'
              ]
            }
          ]
        }
      }
    }
  ]
}

test('or - normal', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  expect(jsonSchema).toEqual(BASE_SCHEMA)
  validate({ genderSpecific: '' })
  expect(validate.errors).toBeTruthy()
  validate({ uuid: '', genderSpecific: '' })
  expect(validate.errors).toBeFalsy()
})

test('and - normal', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  expect(jsonSchema).toEqual(BASE_SCHEMA)
  validate({ guid: '', genderSpecific: '', email: '', password: '' })
  expect(validate.errors).toBeTruthy()
  validate({ guid: '', genderSpecific: '', email: '', password: '', type: '' })
  expect(validate.errors).toBeFalsy()
})

test('nand - normal', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  expect(jsonSchema).toEqual(BASE_SCHEMA)
  validate({ guid: '', genderSpecific: '', readOnlyTrue: '', readOnlyFalse: '' })
  expect(validate.errors).toBeTruthy()
  validate({ guid: '', genderSpecific: '', readOnlyTrue: '' })
  expect(validate.errors).toBeFalsy()
})

test('xor - normal', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  expect(jsonSchema).toEqual(BASE_SCHEMA)
  validate({ guid: '' })
  expect(validate.errors).toBeTruthy()
  validate({ guid: '', maleSpecific: '' })
  expect(validate.errors).toBeFalsy()
})

test('oxor - normal', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  expect(jsonSchema).toEqual(BASE_SCHEMA)
  validate({ guid: '', maleSpecific: '', ip: '', hostname: '' })
  expect(validate.errors).toBeTruthy()
  validate({ guid: '', maleSpecific: '', ip: '' })
  expect(validate.errors).toBeFalsy()
})

test('with - normal', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  expect(jsonSchema).toEqual(BASE_SCHEMA)
  validate({ guid: '', maleSpecific: '', birthTime: '' })
  expect(validate.errors).toBeTruthy()
  validate({ guid: '', maleSpecific: '', birthTime: '', birthday: '' })
  expect(validate.errors).toBeFalsy()
})

test('without - normal', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  expect(jsonSchema).toEqual(BASE_SCHEMA)
  validate({ guid: '', maleSpecific: '', readOnlyTrue: '', writeOnlyTrue: '' })
  expect(validate.errors).toBeTruthy()
  validate({ guid: '', maleSpecific: '', readOnlyTrue: '' })
  expect(validate.errors).toBeFalsy()
})

test('combination - normal', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj)
  const validate = ajv.compile(jsonSchema)

  expect(jsonSchema).toEqual(BASE_SCHEMA)
  validate({ guid: '', genderSpecific: '', hostname: '', email: '', password: '', type: '', birthTime: '', birthday: '', readOnlyTrue: '' })
  expect(validate.errors).toBeFalsy()
})

test('combination - disable all logical convertor', () => {
  const joiObj = JOI_OBJ
  const jsonSchema = parse(joiObj, 'json', {}, { logicalOpParser: false })
  const validate = ajv.compile(jsonSchema)

  expect(jsonSchema).toEqual(_.omit(BASE_SCHEMA, ['allOf', 'dependentRequired']))
  validate({ guid: '', genderSpecific: '', hostname: '', readOnlyFalse: '', email: '', password: '', type: '' })
  expect(validate.errors).toBeFalsy()
})
