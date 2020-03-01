const cmp = require('semver-compare')
const DEFAULT_PARSER = require('./lib/parser_base')

const parsers = [
  require('./lib/parser_v16'),
  require('./lib/parser_v14'),
  DEFAULT_PARSER
]

function convert(joiObj, debug) {
  let parser

  for (let i = 0; i < parsers.length; i++) {
    const tmpParser = parsers[i]
    try {
      let version = tmpParser.getVersion(joiObj)
      let result = cmp(tmpParser.getSupportVersion(), version)
      if (result <= 0) {
        // The first parser has smaller or equal version
        parser = tmpParser
        break
      }
    } catch (e) {
      // Format does not match this parser version.
      // Skip to check the next one
      continue
    }
  }

  if (!parser) {
    console.warn('No parser available, using the default one')
    parser = DEFAULT_PARSER
  }

  const parserObj = new parser(joiObj)
  if (debug) {
    console.debug(`Parser of verison ${parser.getSupportVersion()} is chosen.\n`)
    console.debug(`Joi Object Describe Result as below:\n${JSON.stringify(parserObj.joiDescribe, null, 2)}\n`)
  }
  return parserObj.jsonSchema
}

module.exports = convert
