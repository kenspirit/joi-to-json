module.exports = function (joi) {
  return {
    insensitive_falsy: joi.boolean().falsy('N', 'No').sensitive(false),
    insensitive_truthy: joi.boolean().truthy('Y', 'Yes').sensitive(false),
    sensitive_falsy: joi.boolean().falsy('N', 'No').sensitive(true),
    sensitive_truthy: joi.boolean().truthy('Y', 'Yes').sensitive(true)
  }
}
