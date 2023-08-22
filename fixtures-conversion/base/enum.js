module.exports = function(joi) {
  return {
    extended_enum: joi
      .string()
      .valid('a', 'b', 'c')
      .example('a')
      .example('b')
      .example('c')
      .valid('x', 'y', 'z')
      .example('x')
      .example('y')
      .example('z'),
    enum_override: joi
      .string()
      .valid('a', 'b', 'c')
      .example('a')
      .example('b')
      .example('c')
      .valid(joi.override, 'x', 'y', 'z')
      .example('x', { override: true })
      .example('y')
      .example('z'),
    enum_empty_override: joi
      .string()
      .valid('a', 'b', 'c')
      .valid(joi.override)
  }
}
