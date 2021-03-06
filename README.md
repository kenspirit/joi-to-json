# joi-to-json

## Objective

I have been using [joi](https://hapi.dev/family/joi/) a lot in different Node.js projects which guards the API.
It's **The most powerful schema description language and data validator for JavaScript.** as it said.

Many times, we need to utilize this schema description to produce other output, such as Swagger OpenAPI doc.
That is why I build [joi-route-to-swagger](https://github.com/kenspirit/joi-route-to-swagger) in the first place.

At the beginning, `joi-route-to-swagger` relies on [joi-to-json-schema](https://github.com/lightsofapollo/joi-to-json-schema/) which utilizes many joi internal api or properties.  I believed there was reason.  Maybe joi did not provide the `describe` api way before.  But I always feel not comfortable and think it's time to move on.

The intention of `joi-to-json` is to support converting different version's joi schema to [JSON Schema (draft-04)](https://json-schema.org/specification-links.html#draft-4) using `describe` api.


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
  * 17.1.0

For all above version, I have tested one complex joi object [fixtures](./fixtures) which covers most of the JSON schema attributes that can be described in joi schema.

Although the versions chosen are the latest one for each major version, I believe it should be supporting other minor version as well.


## Usage

Only one API `convert` is available.

You can optionally provide debug flag `true` as the second argument to check which version of the parser is chosen and the joi schema describe output

```javascript
const convert = require('joi-to-json')

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
  certificate: joi.binary().encoding('base64')
})

const jsonSchema = convert(joiSchema, true)
```

The output json format is [here](./output.json)

## Test

>npm run test

You can optionally set below environment variables:

* `CASE_PATTERN=joi-obj-12` to control which version of joi obj to test
* `DEBUG=true` to check which version of the parser is chosen and the joi schema describe output


## License

MIT
