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
    _.each(joiObj.rules, (rule, _idx) => {
      const name = rule.name
      if (['min', 'max', 'length'].includes(name)) {
        rule.args = {
          limit: rule.arg
        }
      }
      delete rule.arg
    })

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

    this._convertDependencies(joiObj)
  }

  _convertDependencies(joiObj) {
    _.each(joiObj.dependencies, (dependency) => {
      if (dependency.key === null) {
        delete dependency.key
      }
      if (dependency.type) {
        dependency.rel = dependency.type
        delete dependency.type
      }
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
    // backup alternatives setting
    const alternatives = joiObj.alternatives
    let fieldName = 'matches'

    if (joiObj.base) {
      // When case is based on one schema type
      fieldName = 'whens'

      const baseType = joiObj.base
      delete joiObj.base
      delete joiObj.alternatives
      if (joiObj.flags && joiObj.flags.presence) {
        delete joiObj.flags.presence
      }

      this.toBaseSpec(baseType)

      _.merge(joiObj, baseType)
    }

    // Convert alternatives
    joiObj[fieldName] = _.map(alternatives, (alternative) => {
      if (alternative.peek || alternative.ref) {
        if (alternative.peek) {
          alternative.is = alternative.peek
          delete alternative.peek
        }

        return _.mapValues(alternative, (value, condition) => {
          switch (condition) {
            case 'is':
              this.toBaseSpec(value)
              if (alternative.ref) {
                // alternative field reference case
                value.type = 'any'
                value.allow.splice(0, 0, { 'override': true })
              }
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
      } else {
        return {
          schema: this.toBaseSpec(alternative)
        }
      }
    })

    // FIXME: Joi seems merging the `is` to `then` schema
    _.forEach(joiObj[fieldName], (alternative) => {
      if (alternative.is && alternative.then) {
        if (alternative.is.type === 'object') {
          const isKeys = Object.keys(alternative.is.keys)
          _.forEach(isKeys, (key) => {
            delete alternative.then.keys[key]
          })
        }
      }
    })

    delete joiObj.alternatives
  }

  _convertBinary(joiObj) {
    _.each(joiObj.rules, (rule, _idx) => {
      const name = rule.name
      if (['min', 'max', 'length'].includes(name)) {
        rule.args = {
          limit: rule.arg
        }
      }
      delete rule.arg
    })
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
    if (_.isArray(joiObj.truthy)) {
      _.remove(joiObj.truthy, (i) => i === true)
      if (joiObj.truthy.length === 0) {
        delete joiObj.truthy
      }
    }
    if (_.isArray(joiObj.falsy)) {
      _.remove(joiObj.falsy, (i) => i === false)
      if (joiObj.falsy.length === 0) {
        delete joiObj.falsy
      }
    }
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
      if (name === 'has') {
        this.toBaseSpec(rule.arg)
        rule.args = {
          schema: rule.arg
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
    }
    delete joiObj.flags.allowOnly
    if (joiObj.flags.allowUnknown) {
      joiObj.flags.unknown = joiObj.flags.allowUnknown
    }
    delete joiObj.flags.allowUnknown
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
    if (joiObj.invalids) {
      // FIXME Looks like before v16, joi spec default add [''] for string and [Infinity,-Infinity] for number
      if (!(joiObj.invalids.length === 1 && joiObj.invalids[0] === '') &&
        !(joiObj.invalids.length === 2 && joiObj.invalids[0] === Infinity && joiObj.invalids[1] === -Infinity)) {
        joiObj.invalid = joiObj.invalids
      }
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
      case 'binary':
        this._convertBinary(joiObj)
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
