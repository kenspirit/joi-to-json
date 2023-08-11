module.exports = function(joi) {
  return {
    conditional: joi.alternatives().when('gender', {
      is: 'Male',
      then: joi.string().not().empty().required(),
      otherwise: joi.optional()
    }),
    conditional_schema: joi.alternatives().when(joi.string(), {
      then: joi.string().not().empty().required(),
      otherwise: joi.optional()
    }),
    match_any: joi.alternatives().try(joi.number(), joi.string())
  }
}
