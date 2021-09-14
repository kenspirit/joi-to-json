const BaseConverter = require('./v16.1.8')

class JoiSpecConvertor extends BaseConverter {
  static getSupportVersion() {
    return '17'
  }
}

module.exports = JoiSpecConvertor
