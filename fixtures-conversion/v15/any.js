module.exports = function(joi) {
  return {
    allow: joi.string().allow('', null),
    default: joi.any().default('Male'),
    description: joi.any().description('Hero Nickname'),
    example: joi.any().example(['鹄思乱想', { parent: { sibling: 10 } }]),
    forbidden: joi.forbidden(),
    meta: joi.any().meta({ 'x-expandable': true, 'x-lookup': 'name', 'z-ignore': true, format: 'custom_format', 'x-supported-lang': ['zh-CN', 'en-US'], deprecated: true }),
    required: joi.any().required(),
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
    })
  }
}
