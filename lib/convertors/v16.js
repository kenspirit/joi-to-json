const BaseConverter = require('./v15')

class JoiSpecConvertor extends BaseConverter {
  static getVersion(joiObj) {
    return joiObj.$_root.version
  }

  static getSupportVersion() {
    return '16'
  }

  // All methods are overridden because the Joi v16.1.8 spec is closed to the latest version
  _convertExamples(_joiObj) { }

  _convertObject(_joiObj) { }

  _convertDate(_joiObj) { }

  _convertAlternatives(_joiObj) { }

  _convertBinary(_joiObj) { }

  _convertString(_joiObj) { }

  _convertNumber(_joiObj) { }

  _convertBoolean(_joiObj) { }

  _convertArray(_joiObj) {}
}

module.exports = JoiSpecConvertor
