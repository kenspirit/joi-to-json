module.exports = function(joi) {
  return {
    conditional: joi.alternatives().when('gender', {
      is: 'Male',
      then: joi.string().invalid('', null),
      otherwise: joi.number().greater(0)
    }),
    conditional_schema: joi.alternatives().when(joi.string(), {
      then: joi.string().invalid('', null),
      otherwise: joi.number().greater(0)
    }).meta({ 'if-style': false }),
    match_any: joi.alternatives().try(joi.number(), joi.string())
  }
}
