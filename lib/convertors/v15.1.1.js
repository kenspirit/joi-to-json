const BaseConverter = require('./v14.3.1')

class JoiSpecConvertor extends BaseConverter {
  static getSupportVersion() {
    return '15'
  }
}

module.exports = JoiSpecConvertor
