module.exports = function (joi) {
  return {
    allow: joi.string().allow('', null),
    default: joi.any().default('Male'),
    description: joi.any().description('Hero Nickname'),
    example: joi.any().example('鹄思乱想'),
    forbidden: joi.forbidden(),
    id: joi.any().id('person'),
    meta: joi.any().meta({ 'x-expandable': true, 'x-lookup': 'name', 'z-ignore': true, format: 'custom_format', 'x-supported-lang': ['zh-CN', 'en-US'], deprecated: true }),
    required: joi.any().required(),
    shared: joi.any().shared(joi.string().id('unifiedString')),
    valid: joi.any().valid('Male', 'Female', 0, 1, '', null),
    when_multiple: joi.object().keys({
      key: joi.string()
    }).when(joi.object().keys({ key: joi.valid('xxx') }).unknown(),
      { then: joi.object().keys({ key1: joi.string().required() }) }
    ).when(joi.object().keys({ key: joi.valid('yyy') }).unknown(),
      { then: joi.object().keys({ key2: joi.string().required() }) }
    ),
    when_is: joi.any().when('gender', {
      is: 'Female',
      then: joi.number().valid(0, 1, 2).required(),
      otherwise: joi.string()
    }),
    when_not: joi.any().when('gender', {
      not: 'Female',
      then: joi.number().valid(0, 1, 2).required(),
      otherwise: joi.boolean()
    }),
    when_switch: joi.any().when('gender', {
      switch: [
        { is: 0, then: joi.string() },
        { is: joi.number().greater(160), then: joi.number() },
        { is: joi.number().greater(300), then: joi.object().keys({ name: joi.string(), level: joi.number() }), otherwise: joi.string() }
      ]
    })
  }
}
