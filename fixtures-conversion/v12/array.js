module.exports = function (joi) {
  return {
    length: joi.array().items(joi.string()).length(2),
    minMax: joi.array().items(joi.string()).min(1).max(3)
  }
}
