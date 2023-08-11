module.exports = function (joi) {
  return {
    conditional: joi.alternatives().conditional('gender', {
      is: 'Male',
      then: joi.string().not().empty().required(),
      otherwise: joi.optional()
    }),
    conditional_schema: joi.alternatives().conditional(joi.string(), {
      then: joi.string().not().empty().required(),
      otherwise: joi.optional()
    }),
    conditional_switch: joi.alternatives().conditional('height', {
      switch: [
        { is: 0, then: joi.link('#unifiedString') },
        { is: joi.number().greater(160), then: joi.number() },
        { is: joi.number().greater(300), then: joi.object().keys({ name: joi.string(), level: joi.number() }), otherwise: joi.string() }
      ]
    }),
    match_any: joi.alternatives().try(joi.number(), joi.string()),
    match_all: joi.alternatives().try(joi.number(), joi.string()).match('all'),
    match_one: joi.alternatives().try(joi.number(), joi.string()).match('one')
  }
}
