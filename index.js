const cmp = require('semver-compare')
const fs = require('fs')
const path = require('path')

const convertorsDir = path.resolve(__dirname, './lib/convertors')
const parsersDir = path.resolve(__dirname, './lib/parsers')
const convertors = []
const parsers = {}

fs.readdirSync(convertorsDir).sort().reverse().forEach(file => {
  if (file.endsWith('.js')) {
    const convertor = require(`${convertorsDir}/${file}`)
    convertors.push(convertor)
  }
})

fs.readdirSync(parsersDir).forEach(file => {
  if (file.endsWith('.js')) {
    const parser = require(`${parsersDir}/${file}`)
    parsers[file.split('.')[0]] = parser
  }
})

function parse(joiObj, type = 'json') {
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

  const joiBaseSpec = new convertor().toBaseSpec(joiObj.describe())
  const parser = parsers[type]
  if (!parser) {
    throw new Error(`No parser is registered for ${type}`)
  }

  return new parser().parse(joiBaseSpec)
}

module.exports = parse
