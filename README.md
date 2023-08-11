# joi-to-json

## Objective

I have been using [joi](https://joi.dev/) a lot in different Node.js projects to guard the API.
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

### Joi to OpenAPI

Most Joi specifications result in the expected OpenAPI schema. 

E.g.,

```js
const joi = require('joi')
const { dump } = require('js-yaml')
const { writeFile } = require('fs/promises')

const joiSchema = joi.object().keys({
  uuid: joi.string().uuid({ version: ['uuidv3', 'uuidv5'] }),
  nickName: joi.string().required().example('鹄思乱想').description('Hero Nickname').min(3).max(20).pattern(/^[a-z]+$/, { name: 'alpha', invert: true }),
  avatar: joi.string().required().uri(),
  email: joi.string().email(),
  ip: joi.string().ip({ version: ['ipv4', 'ipv6'] }),
  hostname: joi.string().hostname().insensitive(),
  gender: joi.string().valid('Male', 'Female', '', null).default('Male'),
  isoDateString: joi.string().isoDate(),
  isoDurationString: joi.string().isoDuration(),
  birthday: joi.date().iso(),
  certificate: joi.binary().encoding('base64'),
  tags: joi.array().items(joi.string().required()).length(2),
  nested: joi.object().keys({
    key: joi.string()
  }).unknown(true)
}).unknown(false)

async function writeYAML(targetPath) {
  const openApiSchema = parse(joiSchema, 'open-api')

  const openApiSchemaYAML = dump(openApiSchema, {lineWidth: 120, noCompatMode: true})
  await writeFile(targetPath, openApiSchemaYAML)
}
```

results in

```yaml
type: object
required:
  - nickName
  - avatar
properties:
  uuid:
    type: string
    format: uuid
  nickName:
    description: Hero Nickname
    type: string
    pattern: ^[a-z]+$
    minLength: 3,
    maxLength: 20,
    example: 鹄思乱想
  avatar:
    type: string
    format: uri
  email:
    type: string
    format: email
  ip:
    type: string
    oneOf:
      - format: ipv4
      - format: ipv6
  hostname:
    type: string
    format: hostname
  gender:
    type: string
    default: Male
    enum:
      - Male
      - Female
      - ''
      - null
    nullable: true
  isoDateString:
    type: string
    format: date-time
  isoDurationString:
    type: string
    format: duration
  birthday:
    type: string
    format: date-time
  certificate:
    type: string
    format: binary
  tags:
    type: array
    items:
      type: string
    minItems: 2
    maxItems: 2
  nested:
    type: object
    properties:
      key:
        type: string
    additionalProperties: true    
additionalProperties: false
```

Some OpenAPI features are not supported directly in Joi, but Joi schemas can be annotated with `joi.any().meta({…})` 
to get them in the OpenAPI schema:

```js
…

const joiSchema = joi.object().keys({
  deprecatedProperty: joi.string().meta({ deprecated: true }).required(),
  readOnlyProperty: joi.string().meta({ readOnly: true }),
  writeOnlyProperty: joi.string().meta({ writeOnly: true }),
  xMeta: joi.string().meta({ 'x-meta': 42 }),
  unknownMetaProperty: joi.string().meta({ unknownMeta: 42 })
}).unknown(true)

…
```

begets:

```yaml
type: object
required:
  - deprecatedProperty
properties:
  deprecatedProperty:
    type: string
    deprecated: true
  readOnlyProperty:
    type: string
    readOnly: true
  writeOnlyProperty:
    type: string
    writeOnly: true
  xMeta:
    type: string
    x-meta: 42
  unknownMetaProperty:
    type: string
    # unknownMeta is not exported
additionalProperties: true
```

## Special Joi Operator Support

* [Logical Relation Operator](./docs/logical_rel_support.md)

## Browser support
For generating JSON Schema in a browser you should use below import syntax for `joi` library in order to work because the `joi` browser minimized build does not have `describe` api which the `joi-to-json` relies on.

```typescript
  import Joi from 'joi/lib/index';
```

## TypeScript support

```typescript
import joi from 'joi';
import * as Joi2Json from 'joi-to-json';
import parse from 'joi-to-json';

const logicalOpParser: Joi2Json.LogicalOpParserOpts = {
  with: function (a) {}
};

parse(joi.string()); // Default call
parse(joi.string(), 'json', {}, { logicalOpParser: false }); // Completely disable Logical Relation Operator
parse(joi.string(), 'open-api', {}, { logicalOpParser }); // Partially override Logical Relation Operator
```

## Test

>npm run test

You can optionally set below environment variables:

* `CASE_PATTERN=joi-obj-17` to control which version of joi obj to test

## Known Limitation

* For `object.pattern` usage in Joi, `pattern` parameter can only be a regular expression now as I cannot convert Joi object to regex yet.

## Updates

**Version 2.3.0**

* Supports named link for schema resuse, such as `.link('#person')`.  **For `open-api` conversion**, as the shared schemas are located in `#/components/schemas` which is not self-contained, the conversion result contains an **extra `schemas`** field so that you can extract it when required.

## License

MIT
