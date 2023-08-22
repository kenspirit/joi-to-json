module.exports = function (joi) {
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
      .example('z')
  }
}
