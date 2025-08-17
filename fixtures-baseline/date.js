module.exports = function (joi) {
  return {
    iso: joi.date().iso(),
    timestamp: joi.date().timestamp('unix')
  }
}
