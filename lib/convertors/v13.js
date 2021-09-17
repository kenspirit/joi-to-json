const BaseConverter = require('./v12')

class JoiSpecConvertor extends BaseConverter {
  static getSupportVersion() {
    return '13'
  }
}

module.exports = JoiSpecConvertor
