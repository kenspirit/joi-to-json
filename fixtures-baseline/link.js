module.exports = function (joi) {
  const unitSchema = joi.object().keys({
    quantity: joi.number().precision(2).positive().greater(0).less(200),
    unit: joi.string().required()
  }).id('unit')
  const unifiedString = joi.string().id('unifiedString')

  return {
    link: joi.object().keys({
      genderSpecific: joi.when('gender', {
        is: 'Female',
        then: joi.number().valid(0, 1, 2).required(),
        otherwise: joi.link('#unifiedString')
      }),
      height: joi.link('#unit').shared(unitSchema),
      heightRank: joi.alternatives().conditional('height', {
        switch: [
          { is: 0, then: joi.link('#unifiedString') },
          { is: joi.number().greater(160), then: joi.number() },
          { is: joi.number().greater(300), then: joi.object().keys({ name: joi.string(), level: joi.number() }), otherwise: joi.string() }
        ]
      }),
      weight: joi.link('#unit').shared(unitSchema),
      children: joi.array().items(joi.link('#person'))
    }).id('person').shared(unifiedString)
  }
}
