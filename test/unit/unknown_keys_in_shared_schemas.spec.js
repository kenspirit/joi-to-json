const joi = require('joi')
const parse = require('../../index')

const JOI_SCHEMA = joi.object().pattern(/a/, joi.array().items(joi.string())).id('patternObject')

const expected = {
  'additionalProperties': false,
  'properties': { '/a/': { 'items': { 'type': 'string' }, 'type': 'array' } }, 'type': 'object'
}

test('open-api - patternProperties should not in shared schemas', () => {
  const sharedSchemas = {};
  const result = parse(JOI_SCHEMA, 'open-api', sharedSchemas)
  expect(result).toEqual({
    '$ref': '#/components/schemas/patternObject',
    schemas: { patternObject: expected }
  })
  expect(sharedSchemas['patternObject']).toEqual(expected)
})
