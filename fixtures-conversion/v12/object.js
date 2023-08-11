module.exports = function (joi) {
  return {
    length: joi.object().length(3),
    or: joi.object().keys({
      'guid': joi.string(),
      'uuid': joi.string()
    }).or('guid', 'uuid'),
    and: joi.object().keys({
      'email': joi.string(),
      'password': joi.string(),
      'type': joi.string()
    }).and('email', 'password', 'type'),
    nand: joi.object().keys({
      'readOnlyTrue': joi.string(),
      'readOnlyFalse': joi.string()
    }).nand('readOnlyTrue', 'readOnlyFalse'),
    xor: joi.object().keys({
      'genderSpecific': joi.string(),
      'maleSpecific': joi.string()
    }).xor('genderSpecific', 'maleSpecific'),
    with_without: joi.object().keys({
      'readOnlyTrue': joi.string(),
      'readOnlyFalse': joi.string(),
      'writeOnlyTrue': joi.string(),
      'writeOnlyFalse': joi.string(),
      'birthTime': joi.string(),
      'birthday': joi.string()
    }).with('birthTime', ['birthday'])
      .without('readOnlyTrue', ['writeOnlyTrue', 'writeOnlyFalse']),
    minMax: joi.object().min(4).max(12),
    pattern: joi.object()
      .pattern(/s/, joi.object().keys({
        id: joi
          .number()
          .required(),
        name: joi
          .string()
          .allow('', null)
          .required()
      })),
    unknown_false: joi.object().unknown(false),
    unknown_true: joi.object().unknown(true)
  }
}
