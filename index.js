const JoiJsonSchemaParser = require('./lib/parsers/json')
const JoiOpenApiSchemaParser = require('./lib/parsers/open-api')
const JoiOpenApiThreePointOneSchemaParser = require('./lib/parsers/open-api-3.1')
const JoiJsonDraftSchemaParser19 = require('./lib/parsers/json-draft-2019-09')
const JoiJsonDraftSchemaParser = require('./lib/parsers/json-draft-04')

const parsers = {
  'json-draft-2019-09': JoiJsonDraftSchemaParser19,
  'json-draft-04': JoiJsonDraftSchemaParser,
  json: JoiJsonSchemaParser,
  'open-api': JoiOpenApiSchemaParser,
  'open-api-3.1': JoiOpenApiThreePointOneSchemaParser
}

function parse(joiObj, type = 'json', definitions = {}, parserOptions = {}) {
  if (typeof joiObj.describe !== 'function') {
    throw new Error('Not an joi object.')
  }

  const joiBaseSpec = joiObj.describe()
  const parser = parsers[type]
  if (!parser) {
    throw new Error(`No parser is registered for ${type}`)
  }

  return new parser(parserOptions).parse(joiBaseSpec, definitions)
}

module.exports = parse
