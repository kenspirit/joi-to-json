const joi = require('joi-15')

const joiRequired = joi.defaults((schema) => schema.options({
  presence: 'required'
}))
const joiAllowUnknown = joi.defaults((schema) => schema.options({
  allowUnknown: true
}))

module.exports = joi.object().keys({
  guid: joi.string().guid({ version: ['uuidv2', 'uuidv4'] }),
  uuid: joi.string().uuid({ version: ['uuidv3', 'uuidv5'] }),
  nickName: joi.string().required().example('鹄思乱想').description('Hero Nickname').min(3).max(20).regex(/^[a-z]+$/, { name: 'alpha', invert: true }),
  avatar: joi.string().required().uri(),
  password: joi.forbidden(),
  email: joi.string().email(),
  ip: joi.string().ip({ version: ['ipv4', 'ipv6'] }),
  hostname: joi.string().hostname().insensitive(),
  gender: joi.string().valid('Male', 'Female', '', null).default('Male'),
  genderSpecific: joi.when('gender', {
    is: 'Female',
    then: joi.number().valid(0, 1, 2).required(),
    otherwise: joi.string()
  }),
  maleSpecific: joi.alternatives().when('gender', {
    is: 'Male',
    then: joi.string().not().empty().required(),
    otherwise: joi.optional()
  }),
  height: joi.number().precision(2).positive().greater(0).less(200),
  isoDateString: joi.string().isoDate(),
  birthday: joi.date().iso(),
  birthTime: joi.date().timestamp('unix'),
  skills: joi.array().items(joi.alternatives().try(
    joi.string(),
    joi.object().keys({
      name: joi.string().example(['teleport', { parent: { sibling: 10 } }]).alphanum().description('Skill Name').lowercase().required(),
      level: joi.number().integer().min(10).max(100).default(50).multiple(10).example(10).description('Skill Level')
    }).unknown(true).meta({ 'x-expandable': true, 'x-lookup': 'name' })
  ).required()).min(1).max(3).unique().description('Skills').meta({ 'z-ignore': true, 'x-exchangable': false }),
  tags: joi.array().items(joi.string().required()).length(2),
  retired: joi.boolean().truthy('yes').falsy('no').insensitive(true),
  certificate: joi.binary().encoding('base64'),
  notes: joi.any().meta({ 'x-supported-lang': ['zh-CN', 'en-US'] }),
  facebookId: joi.string().allow(null),
  meta: joiRequired.object().keys({
    hash: joiRequired.string().ip().meta({ format: 'override_ip_format' }),
    optional: joiRequired.number().optional().meta({ format: 'custom_format' })
  }),
  nested: joiAllowUnknown.object().keys({
    key: joiAllowUnknown.string()
  }),
  dynamicKeyHolder: joi
    .object()
    .pattern(/s/, joi.object().keys({
      id: joi
        .number()
        .description('Tbe ID for the reference')
        .example(123)
        .required(),
      name: joi
        .string()
        .allow('', null)
        .description('Name of something')
        .example('Jack')
        .required()
    }).unknown(false))
    .description('Some kind of list')
    .optional()
})
