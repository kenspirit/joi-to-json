const BaseConverter = require('./v14')

class JoiSpecConvertor extends BaseConverter {
  static getSupportVersion() {
    return '15'
  }
}

module.exports = JoiSpecConvertor
