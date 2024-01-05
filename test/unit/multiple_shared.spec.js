const Joi = require('joi-17')
const parse = require('../../index')

test('Multiple shared schemas should be included correctly.', () => {
  const shared1 = Joi.string().valid('Something-1').id('Something-1')
  const shared2 = Joi.string().valid('Something-2').id('Something-2')

  const schemaUsingShared = Joi.object({
    random: Joi.link('#Something-2'),
    random2: Joi.link('#Something-1')
  })
    .shared(shared1)
    .shared(shared2)

  const result = {
    'type': 'object',
    'properties': {
      'random': { '$ref': '#/$defs/Something-2' },
      'random2': { '$ref': '#/$defs/Something-1' }
    },
    'additionalProperties': false,
    '$defs': {
      'Something-1': { 'const': 'Something-1' },
      'Something-2': { 'const': 'Something-2' }
    }
  }

  expect(parse(schemaUsingShared)).toEqual(result)
})
