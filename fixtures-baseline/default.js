module.exports = function (joi) {
  const joiRequired = joi.defaults((schema) => schema.options({
    presence: 'required'
  }))
  const joiAllowUnknown = joi.defaults((schema) => schema.options({
    allowUnknown: true
  }))

  return {
    required: joiRequired.object().keys({
      hash: joiRequired.string(),
      optional: joiRequired.optional()
    }),
    unknown: joiAllowUnknown.object().keys({
      key: joi.string()
    }),
    unknown_override: joiAllowUnknown.object().keys({
      inner: joiAllowUnknown.object().keys({
        a: joi.string(),
        innerMost: joi.object().keys({
          c: joi.string(),
          d: joi.string()
        })
      }).unknown(false)
    })
  }
}
