const BaseConverter = require('./v16')

class JoiSpecConvertor extends BaseConverter {
  static getSupportVersion() {
    return '17'
  }
}

module.exports = JoiSpecConvertor
