module.exports = function (joi) {
  return {
    encoding: joi.binary().encoding('base64'),
    length: joi.binary().length(64),
    minMax: joi.binary().min(64).max(128)
  }
}
