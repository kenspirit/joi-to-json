module.exports = function (joi) {
  return {
    greaterLess: joi.number().greater(0).less(200),
    integer: joi.number().integer(),
    integer_const: joi.number().integer().valid(1),
    minMax: joi.number().integer().min(6).max(21),
    multiple: joi.number().multiple(10),
    negative: joi.number().negative(),
    positive: joi.number().positive(),
    precision: joi.number().precision(2)
  }
}
