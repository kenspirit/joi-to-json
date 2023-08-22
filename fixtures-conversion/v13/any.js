module.exports = function (joi) {
  return {
    allow: joi.string().allow('', null),
    default: joi.any().default('Male'),
    description: joi.any().description('Hero Nickname'),
    example: joi.any().example('鹄思乱想'),
    forbidden: joi.forbidden(),
    meta: joi.any().meta({ 'x-expandable': true, 'x-lookup': 'name', 'z-ignore': true, format: 'custom_format', 'x-supported-lang': ['zh-CN', 'en-US'], deprecated: true, readOnly: false, writeOnly: true }),
    valid: joi.any().valid('Male', 'Female', 0, 1, '', null),
    when_multiple: joi.object().keys({
      key: joi.string()
    }).unknown()
    .when(joi.object().keys({ key: joi.valid('xxx') }).unknown(),
      { then: joi.object().keys({ key1: joi.string().required() }).unknown() }
    ).when(joi.object().keys({ key: joi.valid('yyy') }).unknown(),
      { then: joi.object().keys({ key2: joi.string().required() }).unknown() }
    ).meta({ 'if-style': false }),
    when_is: joi.any().when('gender', {
      is: 'Female',
      then: joi.number().valid(0, 1, 2).required(),
      otherwise: joi.string()
    })
  }
}
