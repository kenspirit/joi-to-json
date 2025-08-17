const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const joi = require('joi')

const fixtures = fs.readdirSync(path.resolve(__dirname, '../fixtures-baseline/'))

fixtures.forEach((fixtureFileName) => {
  const fixtureFn = require(path.resolve(__dirname, `../fixtures-baseline/${fixtureFileName}`))
  const fixture = fixtureFn(joi)

  Object.keys(fixture).forEach((conversionCase) => {
    if (process.env.TEST_CASE && !process.env.TEST_CASE.split(',').includes(conversionCase)) {
      return
    }

    test(`Baseline Schema: ${fixtureFileName} - ${conversionCase}`, () => {
      const result = fixture[conversionCase].describe()

      const output = require(path.resolve(__dirname, `../outputs-baseline/${fixtureFileName.replace(/\.js/, '')}/${conversionCase}`))
      expect(result).toEqual(output)
    })
  })
})

