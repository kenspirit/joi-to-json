const _ = require('lodash')

class JoiSpecConvertor {
  constructor() {}

  static getVersion(joiObj) {
    return joiObj._currentJoi.version
  }

  static getSupportVersion() {
    return '12'
  }

  _convertObject(joiObj) {
    if (joiObj.children) {
      joiObj.keys = joiObj.children
      delete joiObj.children
    }

    _.each(joiObj.keys, (value, _key) => {
      this.toBaseSpec(value)
    })

    _.each(joiObj.patterns, (pattern, _idx) => {
      this.toBaseSpec(pattern.rule)
    })
  }

  _convertDate(joiObj) {
    if (joiObj.flags.timestamp) {
      joiObj.flags.format = joiObj.flags.timestamp
      delete joiObj.flags.timestamp
      delete joiObj.flags.multiplier
    } else if (joiObj.flags.format = {}) {
      joiObj.flags.format = 'iso'
    }
  }

  _convertAlternatives(joiObj) {
    if (joiObj.base && joiObj.base.type === 'any') {
      // when case
      joiObj.type = 'any'
      joiObj.whens = joiObj.alternatives

      if (joiObj.flags.presence === 'ignore') {
        // FIXME: Not sure when this flag is set.
        delete joiObj.flags.presence
      }
      if (joiObj.whens.peek) {
        joiObj.whens.is = joiObj.whens.peek
        delete joiObj.whens.peek
      }

      joiObj.whens[0] = _.mapValues(joiObj.whens[0], (value, condition) => {
        switch (condition) {
          case 'is':
            this.toBaseSpec(value)
            value.type = 'any'
            // FIXME: Not sure when this is set.
            value.allow.splice(0, 0, { 'override': true })
            break
          case 'otherwise':
            this.toBaseSpec(value)
            break
          case 'then':
            this.toBaseSpec(value)
            break
          case 'ref':
            if (value.indexOf('ref:') === 0) {
              value = {
                path: value.replace('ref:', '').split('.')
              }
            }
            break
        }
        return value
      })

      delete joiObj.alternatives
      delete joiObj.base
    } else {
      joiObj.matches = _.map(joiObj.alternatives, (alternative) => {
        return {
          schema: this.toBaseSpec(alternative)
        }
      })
      delete joiObj.alternatives
    }
  }

  _convertString(joiObj) {
    delete joiObj.options

    _.each(joiObj.rules, (rule, _idx) => {
      const name = rule.name
      if (['min', 'max'].includes(name)) {
        rule.args = {
          limit: rule.arg
        }
      } else if (['lowercase', 'uppercase'].includes(name)) {
        rule.name = 'case'
        rule.args = {
          direction: name.replace('case', '')
        }
        delete joiObj.flags.case
      } else if (rule.arg) {
        rule.args = {
          options: rule.arg
        }
      }
      if (name === 'regex') {
        rule.name = 'pattern'
        rule.args.regex = rule.arg.pattern.toString()
        delete rule.args.options.pattern
      }
      delete rule.arg
    })
  }

  _convertNumber(joiObj) {
    _.each(joiObj.rules, (rule, _idx) => {
      const name = rule.name
      if (['positive', 'negative'].includes(name)) {
        rule.args = {
          sign: name
        }
        rule.name = 'sign'
      }
      if (['greater', 'less', 'min', 'max', 'precision'].includes(name)) {
        rule.args = {
          limit: rule.arg
        }
      }
      if (name === 'multiple') {
        rule.args = {
          base: rule.arg
        }
      }
      delete rule.arg
    })

    if (joiObj.flags.precision) {
      delete joiObj.flags.precision
    }
  }

  _convertBoolean(joiObj) {
    if (joiObj.flags.insensitive === false) {
      joiObj.flags.sensitive = true
    }
    delete joiObj.flags.insensitive
  }

  _convertArray(joiObj) {
    if (joiObj.flags.sparse === false) {
      delete joiObj.flags.sparse
    }

    _.each(joiObj.rules, (rule, _idx) => {
      const name = rule.name
      if (['min', 'max', 'length'].includes(name)) {
        rule.args = {
          limit: rule.arg
        }
      }
      delete rule.arg
    })

    _.each(joiObj.items, (item, _idx) => {
      this.toBaseSpec(item)
    })
  }

  _convertExamples(_joiObj) {
  }

  toBaseSpec(joiObj) {
    joiObj.flags = joiObj.flags || {}

    if (joiObj.flags.allowOnly) {
      joiObj.flags.only = joiObj.flags.allowOnly
      delete joiObj.flags.allowOnly
    }
    if (joiObj.flags.allowUnknown) {
      joiObj.flags.unknown = joiObj.flags.allowUnknown
      delete joiObj.flags.allowUnknown
    }
    if (joiObj.description) {
      joiObj.flags.description = joiObj.description
      delete joiObj.description
    }
    if (joiObj.options) {
      joiObj.preferences = joiObj.options
      delete joiObj.options
    }
    if (joiObj.valids) {
      joiObj.allow = joiObj.valids
      delete joiObj.valids
    }
    if (joiObj.meta) {
      joiObj.metas = joiObj.meta
      delete joiObj.meta
    }
    delete joiObj.invalids

    this._convertExamples(joiObj)

    switch (joiObj.type) {
      case 'object':
        this._convertObject(joiObj)
        break
      case 'date':
        this._convertDate(joiObj)
        break
      case 'alternatives':
        this._convertAlternatives(joiObj)
        break
      case 'string':
        this._convertString(joiObj)
        break
      case 'number':
        this._convertNumber(joiObj)
        break
      case 'boolean':
        this._convertBoolean(joiObj)
        break
      case 'array':
        this._convertArray(joiObj)
        break
      default:
        break
    }
    if (_.isEmpty(joiObj.flags)) {
      delete joiObj.flags
    }

    return joiObj
  }
}

module.exports = JoiSpecConvertor
