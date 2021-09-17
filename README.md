# joi-to-json

## Objective

I have been using [joi](https://hapi.dev/family/joi/) a lot in different Node.js projects which guards the API.
It's **The most powerful schema description language and data validator for JavaScript.** as it said.

Many times, we need to utilize this schema description to produce other output, such as Swagger OpenAPI doc.
That is why I build [joi-route-to-swagger](https://github.com/kenspirit/joi-route-to-swagger) in the first place.

At the beginning, `joi-route-to-swagger` relies on [joi-to-json-schema](https://github.com/lightsofapollo/joi-to-json-schema/) which utilizes many joi internal api or properties.  I believed there was reason.  Maybe joi did not provide the `describe` api way before.  But I always feel uncomfortable and think it's time to move on.

The intention of `joi-to-json` is to support converting different version's joi schema to [JSON Schema](https://json-schema.org) using `describe` api.

## 2.0.0 is out

It's a breaking change.

* Functionally, output format supports OpenAPI Schema other than purely JSON Schema.  

* Technically, implementation theory has a big change:
  - In v1.0.0, it directly converts `joi.describe()` to JSON schema using different parser implementations.
  - In v2.0.0, `joi.describe()` of different versions are first converted to one base format, the latest version of `joi.describe()` output.  Then different parsers (JSON, OpenAPI) all refer to this base format.

* The benefits of the change are:
  - Easier to retire old version of joi.
  - Easier to support more output formats.

## Installation

>npm install joi-to-json


## Joi Version Support

* @commercial/joi
  * v12.1.0
* joi
  * 13.7.0
  * 14.3.1
* @hapi/joi
  * 15.1.1
  * 16.1.8
* joi
  * 17.4.2

For all above versions, I have tested one complex joi object [fixtures](./fixtures) which covers most of the JSON schema attributes that can be described in joi schema.

Although the versions chosen are the latest one for each major version, I believe it should be supporting other minor version as well.


## Usage

Only one API `parse` is available.  It's signature is `parse(joiObj, type = 'json')`

Currently supported output types:  
* `json` - Default.  Stands for JSON Schema Draft 07
* `open-api` - Stands for OpenAPI Schema
* `json-draft-04` - Stands for JSON Schema Draft 04
* `json-draft-2019-09` - Stands for JSON Schema Draft 2019-09

The output schema format are in [outputs](./outputs) under specific folders for different types.

Sample code is as below:  

```javascript
const parse = require('joi-to-json')

const joiSchema = joi.object().keys({
  nickName: joi.string().required().min(3).max(20).example('鹄思乱想').description('Hero Nickname')
    .regex(/^[a-z]+$/, { name: 'alpha', invert: true }),
  avatar: joi.string().required().uri(),
  email: joi.string().email(),
  ip: joi.string().ip({ version: ['ipv4', 'ipv6'] }),
  hostname: joi.string().hostname().insensitive(),
  gender: joi.string().valid('Male', 'Female', '').default('Male'),
  height: joi.number().precision(2).positive().greater(0).less(200),
  birthday: joi.date().iso(),
  birthTime: joi.date().timestamp('unix'),
  skills: joi.array().items(joi.alternatives().try(
    joi.string(),
    joi.object().keys({
      name: joi.string().example('teleport').alphanum().lowercase().required().description('Skill Name'),
      level: joi.number().integer().min(10).max(100).default(50).multiple(10).example(10).description('Skill Level')
    })
  ).required()).min(1).max(3).unique().description('Skills'),
  tags: joi.array().items(joi.string().required()).length(2),
  retired: joi.boolean().truthy('yes').falsy('no').insensitive(false),
  certificate: joi.binary().encoding('base64'),
  notes: joi.any().meta({ 'x-supported-lang': ['zh-CN', 'en-US'], deprecated: true })
})

const jsonSchema = parse(joiSchema)
// Or parsing to OpenAPI schema through:
// const openApiSchema = parse(joiSchema, 'open-api')
```

## Test

>npm run test

You can optionally set below environment variables:

* `CASE_PATTERN=joi-obj-12` to control which version of joi obj to test

## License

MIT
