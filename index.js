const cmp = require('semver-compare')

const c17 = require('./lib/convertors/v17')
const c16 = require('./lib/convertors/v16')
const c15 = require('./lib/convertors/v15')
const c14 = require('./lib/convertors/v14')
const c13 = require('./lib/convertors/v13')
const c12 = require('./lib/convertors/v12')

const JoiJsonSchemaParser = require('./lib/parsers/json')
const JoiOpenApiSchemaParser = require('./lib/parsers/open-api')
const JoiOpenApiThreePointOneSchemaParser = require('./lib/parsers/open-api-3.1')
const JoiJsonDraftSchemaParser19 = require('./lib/parsers/json-draft-2019-09')
const JoiJsonDraftSchemaParser = require('./lib/parsers/json-draft-04')

const convertors = [
  c17, c16, c15, c14, c13, c12
]
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

  let convertor

  for (let i = 0; i < convertors.length; i++) {
    const tmpConvertor = convertors[i]
    try {
      let version = tmpConvertor.getVersion(joiObj)
      let result = cmp(tmpConvertor.getSupportVersion(), version)
      if (result <= 0) {
        // The first parser has smaller or equal version
        convertor = tmpConvertor
        break
      }
    } catch (e) {
      // Format does not match this parser version.
      // Skip to check the next one
      continue
    }
  }

  if (!convertor) {
    console.warn('No matched joi version convertor found, using the latest version')
    convertor = convertors[0]
  }

  // fs.writeFileSync('./joi_spec.json', JSON.stringify(joiObj.describe(), null, 2))
  const joiBaseSpec = new convertor().toBaseSpec(joiObj.describe())
  // fs.writeFileSync(`./internal_${convertor.getSupportVersion()}_${type}.json`, JSON.stringify(joiBaseSpec, null, 2))
  const parser = parsers[type]
  if (!parser) {
    throw new Error(`No parser is registered for ${type}`)
  }

  return new parser(parserOptions).parse(joiBaseSpec, definitions)
}

module.exports = parse
