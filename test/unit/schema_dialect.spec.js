const joi = require('joi')
const parse = require('../../index')

const JOI_SCHEMA = joi.object().keys({
  field: joi.string()
})

test('json - includes schema dialect', () => {
  expect(parse(JOI_SCHEMA, 'json', {}, { includeSchemaDialect: true }).$schema).toEqual('http://json-schema.org/draft-07/schema#')
})

test('json - no schema dialect', () => {
  expect(parse(JOI_SCHEMA, 'json').$schema).toEqual(undefined)
})

test('json-draft-04 - includes schema dialect', () => {
  expect(parse(JOI_SCHEMA, 'json-draft-04', {}, { includeSchemaDialect: true }).$schema).toEqual('http://json-schema.org/draft-04/schema#')
})

test('json-draft-04 - no schema dialect', () => {
  expect(parse(JOI_SCHEMA, 'json-draft-04').$schema).toEqual(undefined)
})

test('json-draft-2019-09 - includes schema dialect', () => {
  expect(parse(JOI_SCHEMA, 'json-draft-2019-09', {}, { includeSchemaDialect: true }).$schema).toEqual('https://json-schema.org/draft/2019-09/schema')
})

test('json-draft-2019-09 - no schema dialect', () => {
  expect(parse(JOI_SCHEMA, 'json-draft-2019-09').$schema).toEqual(undefined)
})

test('open-api - no schema dialect even specified', () => {
  expect(parse(JOI_SCHEMA, 'open-api', {}, { includeSchemaDialect: true }).$schema).toEqual(undefined)
})

