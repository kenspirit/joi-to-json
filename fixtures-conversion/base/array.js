module.exports = function (joi) {
  return {
    has: joi.array().items(joi.string()).has(joi.string().valid('kc', 'ws')),
    length: joi.array().items(joi.string()).length(2),
    minMax: joi.array().items(joi.string()).min(1).max(3)
  }
}
