module.exports = function (joi) {
  return {
    insensitive_falsy: joi.boolean().falsy('N', 'No').insensitive(true),
    insensitive_truthy: joi.boolean().truthy('Y', 'Yes').insensitive(true),
    sensitive_falsy: joi.boolean().falsy('N', 'No').insensitive(false),
    sensitive_truthy: joi.boolean().truthy('Y', 'Yes').insensitive(false)
  }
}
