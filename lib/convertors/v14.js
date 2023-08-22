const BaseConverter = require('./v13')

class JoiSpecConvertor extends BaseConverter {
  static getSupportVersion() {
    return '14'
  }

  _convertExamples(joiObj) {
    if (joiObj.examples && joiObj.examples.length === 1) {
      const example = joiObj.examples[0]
      joiObj.examples = [example.value]
    }
    if (joiObj.examples && joiObj.allow && joiObj.flags && joiObj.flags.only) {
      joiObj.examples = joiObj.allow
    }
  }

  _convertNumber(joiObj) {
    super._convertNumber(joiObj)

    if (joiObj.flags) {
      delete joiObj.flags.unsafe
    }
  }
}

module.exports = JoiSpecConvertor
