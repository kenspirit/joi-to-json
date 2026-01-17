const joi = require('joi')

// Defaut value of allowUnknown in Joi validate is false

test('unknown_override', () => {
  const joiAllowUnknown = joi.defaults((schema) => schema.options({
    allowUnknown: true
  }))
  const unknown_override = joiAllowUnknown.object().keys({
    inner: joiAllowUnknown.object().keys({
      a: joi.string(),
      innerMost: joi.object().keys({
        c: joi.string(),
        d: joi.string()
      })
    }).unknown(false)
  })


  result = unknown_override.validate({ inner: {}, outerExtra: 'outerExtra' })
  expect(result.error).toBeFalsy()
  result = unknown_override.validate({ inner: { a: 'a', innerMost: { c: 'c', d: 'd' }, innerExtra: 'inner' } })
  expect(result.error).toBeTruthy()
  result = unknown_override.validate({ inner: { a: 'a', innerMost: { c: 'c', innerMostExtra: 'innerMost' }} })
  expect(result.error).toBeFalsy()
})

test('unknown_default', () => {
  const unknown_default = joi.object().keys({
    inner: joi.object().keys({
      a: joi.string(),
      innerMost: joi.object().keys({
        c: joi.string(),
        d: joi.string()
      })
    }).unknown(false)
  })

  result = unknown_default.validate({ inner: {}, outerExtra: 'outerExtra' })
  expect(result.error).toBeTruthy()
  result = unknown_default.validate({ inner: { a: 'a', innerMost: { c: 'c', d: 'd' }, innerExtra: 'inner' } })
  expect(result.error).toBeTruthy()
  result = unknown_default.validate({ inner: { a: 'a', innerMost: { c: 'c', innerMostExtra: 'innerMost' } } })
  expect(result.error).toBeTruthy()
})
