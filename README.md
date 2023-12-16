# joi-to-json

## Objective

I have been using [joi](https://joi.dev/) a lot in different Node.js projects to guard the API.
It's **The most powerful schema description language and data validator for JavaScript.** as it said.

Many times, we need to utilize this schema description to produce other output, such as Swagger OpenAPI doc.
That is why I build [joi-route-to-swagger](https://github.com/kenspirit/joi-route-to-swagger) in the first place.

At the beginning, `joi-route-to-swagger` relies on [joi-to-json-schema](https://github.com/lightsofapollo/joi-to-json-schema/) which utilizes many joi internal api or properties.  Maybe joi did not provide the `describe` api way before, but I always feel uncomfortable of relying on internal api.

The intention of `joi-to-json` is to support converting different version's joi schema to [JSON Schema](https://json-schema.org) using `describe` api.

The implementation of this JOI to JSON conversion tool is simply a pipeline of two components:

1. Convertors
  - Each JOI version has one convertor implementation.
  - It converts the `joi.describe()` output to the baseline format (currently the v16 and v17 one)

2. Parsers
  - Each supported output JSON format (e.g. JSON Draft 07, OpenAPI) has one parser implementation.
  - All parsers converts the baseline format into its own format


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
  * 17.9.2

Although the versions chosen are the latest one for each major version, It should support other minor versions as well.


## Installation

>npm install joi-to-json


## Usage

Only one API `parse` is available.  It's signature is `parse(joiObj, type = 'json')`

Currently supported output types:  
* `json` - Default.  Stands for JSON Schema Draft 07
* `open-api` - Stands for OpenAPI 3.0 Schema - an extended subset of JSON Schema Specification Wright Draft 00 (aka Draft 5)
* `open-api-3.1` - Stands for OpenAPI 3.1 Schema - a superset of JSON Schema Specification Draft 2020-12
* `json-draft-04` - Stands for JSON Schema Draft 04
* `json-draft-2019-09` - Stands for JSON Schema Draft 2019-09

The output schema format are in [outputs](./outputs-parsers) under specific folders for different types.

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

## Features

### Special Joi Operator Support

* [Logical Relation Operator](./docs/logical_rel_support.md)

### Named Link

Supports named link for schema reuse, such as `.link('#person')`.  **For `open-api` conversion**, as the shared schemas are located in `#/components/schemas` which is not self-contained, the conversion result contains an **extra `schemas`** field so that you can extract it when required.

### Conditional Expression

Starting from Draft 7, JSON Specification supports `If-Then-Else` style expression.  Before that, we can also use something called [Implication](http://json-schema.org/understanding-json-schema/reference/conditionals.html#implication) using Schema Composition Approach to simulate that.

By default, the `If-Then-Else` approach is used if the output spec supports it.  However, if the joi conditional expression (`alternatives` or `when`) is annotated using Meta `.meta({ 'if-style': true })`, the JSON schema conversion will use the Composition approach using `allOf` and/or `anyOf` instead.

**Limitation**: Currently, if the joi condition definition is referring to another field, the `If-Then-Else` style output is not supported.  Instead, it simply uses the `anyOf` composing the `then` and `otherwise` on the defined field.


## YAML File Generation

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

### Categories of Test Cases

* JOI Standard Representation Conversion

`fixtures-conversion` folder stores each JOI version's supported keyword for different data types.
In case any data type or keyword is not supported in historical JOI version, we can just create customized file to override the `base` version, such as `v15/link.js`.

Standard converted results are stored in `outputs-conversion` folder.

`test/conversion.spec.js` Test Spec handles all supported JOI versions' conversion verificaiton.

* JSON output format Conversion

`outputs-parsers` folder stores different output formats base on the JOI Standard Representation in `outputs-conversion` folder.
The Test Spec under `test/parser/` are responsible for these area.

* JSON schema (Draft 07) Validity Unit Test

For special **Logical Relation Operator** and **Conditional Expression**, some Unit Tests are created to verify the JOI Spec and corresponding JSON Spec are valid of the same verification intention.


### Test Debug Approach

When running `conversion.spec.js`, below environment variables can be set:

* `TEST_CONVERTOR`: control which version of joi to test.
  Example: `TEST_CONVERTOR=v17`
* `TEST_CASE`: control which test cases to verify.  Name of the test cases is the key of the return object in `fixtures-conversion`.
  Example: `TEST_CASE=conditional,match_all` verifies the case in `alternatives.js`
* `TEST_UPDATE_CONVERSION_BASELINE`: control whether writes the baseline file generated from the latest-version convertor (Currently `v17`).
  It is activated when setting to `true`.

When runninng Test Spec under `test/parser`, below environment variables can be set:

* `TEST_CASE`: control which test cases to verify.
  For example, when running `json.spec.js`, and set `TEST_CASE=conditional,match_all`, it verifies the corresponding JSON files in `outputs-parsers/json/alternatives`.
* `TEST_UPDATE_PARSER_BASELINE`: control whether writes the baseline file for the corresponding parser.
  It is activated when setting to `true`.  For example, when running `json.spec.js`, it writes the baseline files under `outputs-parsers/json`.


## Known Limitation

* For `object.pattern` usage in Joi, `pattern` parameter can only be a regular expression now as I cannot convert Joi object to regex yet.
* `If-Then-Else` style output is not applicable for the condition referring to the other field.

## License

MIT
