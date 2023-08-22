const _ = require('lodash')
const fs = require('fs')
const path = require('path')

const convertors = fs.readdirSync(path.resolve(__dirname, '../lib/convertors'))
const maxConvertorVersion = _.max(convertors)

convertors.forEach((convertorFileName) => {
  const convertorVersion = convertorFileName.replace('.js', '')
  if (process.env.TEST_CONVERTOR && !process.env.TEST_CONVERTOR.split(',').includes(convertorVersion)) {
    return
  }

  const Convertor = require(path.resolve(__dirname, `../lib/convertors/${convertorVersion}`))
  const convertor = new Convertor()

  const fixtures = fs.readdirSync(path.resolve(__dirname, '../fixtures-conversion/base'))

  fixtures.forEach((fixtureFileName) => {
    let fixtureFn = require(path.resolve(__dirname, `../fixtures-conversion/base/${fixtureFileName}`))
    if (fs.existsSync(path.resolve(__dirname, `../fixtures-conversion/${convertorVersion}/${fixtureFileName}`))) {
      // If there is version-specific fixture, use it instead
      fixtureFn = require(path.resolve(__dirname, `../fixtures-conversion/${convertorVersion}/${fixtureFileName}`))
    }
    const fixture = fixtureFn(require(`joi-${convertorVersion.replace('v', '')}`))

    Object.keys(fixture).forEach((conversionCase) => {
      if (process.env.TEST_CASE && !process.env.TEST_CASE.split(',').includes(conversionCase)) {
        return
      }

      test(`Convertor ${convertorVersion}: ${fixtureFileName} - ${conversionCase}`, () => {
        const result = convertor.toBaseSpec(fixture[conversionCase].describe())

        // Can write the expected result (Should be the latest convertor version as baseline)
        if (convertorVersion === maxConvertorVersion && process.env.TEST_UPDATE_CONVERSION_BASELINE === 'true') {
          fs.writeFileSync(
            path.resolve(__dirname, `../outputs-conversion/${fixtureFileName.replace(/\.js/, '')}/${conversionCase}`) + '.json',
            JSON.stringify(result, null, 2)
          )
        }

        const output = require(path.resolve(__dirname, `../outputs-conversion/${fixtureFileName.replace(/\.js/, '')}/${conversionCase}`))
        expect(result).toEqual(output)
      })
    })
  })
})

