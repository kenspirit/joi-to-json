## Logical Relation

There are some logical relation operators in Joi:

* `and`
* `nand`
* `or`
* `xor`
* `oxor` (After Joi v14)
* `with`
* `without`

For different operator, I have managed to describe them in JSON schema as below for different cases.
Some named as `xxxGeneral` means it should be supported since JSON Draft 4.
Some named as `xxxDraft7` means it is using some features until JSON Draft 7.

Hence, if you are converting the Joi to Draft 4 or OpenAPI, the `xor` will be ignored.

### Usage

By default, this feature is enabled.
It can be disabled completely by passing option `{ logicalOpParser: false }` to `parse` API:

`parse(joiObj, 'json', {}, { logicalOpParser: false })`

It's also possible to disable one particular operator or use your own convertor if you come up with a more suitable JSON schema representation by passing options like `{ logicalOpParser: { xor: convertorFun, oxor: null } }`.

The signature of the `convertorFun` is `function (schema, dependency)`.  For example, the built-in `or` convertor function is:

```javascript
function (schema, dependency) {
  schema.anyOf = _.map(dependency.peers, (peer) => {
    return { required: [peer] }
  })
}
```

### OR

```javascript
// At least one of a or b or c exists.
// Failed on { d: 1 }
const orJoi = joi.object({
  a: joi.string(),
  b: joi.number(),
  c: joi.boolean(),
  d: joi.number()
}).or('a', 'b', 'c');

const orSchemaGeneral = {
  type: 'object',
  anyOf: [
    { required: ['a'] }, { required: ['b'] }, { required: ['c'] }
  ],
  properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' }, d: { type: 'number' } },
  additionalProperties: false
}
```

### AND

```javascript
// Either a, b, and c All NOT exists, or all of them exists
// Failed on { a: 'hi', b: 1 }
const andJoi = joi.object({
  a: joi.string(),
  b: joi.number(),
  c: joi.boolean(),
  d: joi.number()
}).and('a', 'b', 'c');

const andSchemaGeneral = {
  type: 'object',
  oneOf: [
    {
      allOf: [
        {
          not: { required: ['a'] }
        },
        {
          not: { required: ['b'] }
        },
        {
          not: { required: ['c'] }
        }
      ]
    },
    { required: ['a', 'b', 'c'] }
  ],
  properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' }, d: { type: 'number' } },
  additionalProperties: false
};
```

### NAND

```javascript
// a, b, and c cannot all exist at the same time
// Failed on { a: 'hi', b: 1, c: true }
const nandJoi = joi.object({
  a: joi.string(),
  b: joi.number(),
  c: joi.boolean(),
  d: joi.number()
}).nand('a', 'b', 'c');

const nandSchemaGeneral = {
  type: 'object',
  not: { required: ['a', 'b', 'c'] },
  properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' }, d: { type: 'number' } },
  additionalProperties: false
};
```

### XOR

```javascript
// Only one of a, b and c can and must exist
// Failed on { d: 1 } or { a: 'hi', b: 1 }
const xorJoi = joi.object({
  a: joi.string(),
  b: joi.number(),
  c: joi.boolean(),
  d: joi.number()
}).xor('a', 'b', 'c');

const xorSchemaDraft7 = {
  type: 'object',
  if: { propertyNames: { enum: ['a', 'b', 'c'] }, minProperties: 2 },
  then: false,
  else: {
    oneOf: [
      {
        required: ['a']
      },
      {
        required: ['b']
      },
      {
        required: ['c']
      }
    ]
  },
  properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' }, d: { type: 'number' } },
  additionalProperties: false
};
```

### OXOR

```javascript
// Only one of a, b and c can exist but none is required
// Failed on { a: 'hi', b: 1 }
const oxorJoi = joi.object({
  a: joi.string(),
  b: joi.number(),
  c: joi.boolean(),
  d: joi.number()
}).oxor('a', 'b', 'c');

const oxorSchemaGeneral = {
  type: 'object',
  oneOf: [
    { required: ['a'] },
    { required: ['b'] },
    { required: ['c'] },
    {
      not: {
        oneOf: [
          { required: ['a'] },
          { required: ['b'] },
          { required: ['c'] },
          { required: ['a', 'b'] },
          { required: ['a', 'c'] },
          { required: ['b', 'c'] } // Combination up to 2 elements
        ]
      }
    }
  ],
  properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' }, d: { type: 'number' } },
  additionalProperties: false
};
```

### WITH

```javascript
// With d exists, both a and b must exist
// Failed on { d: 1, a: '' }
const withJoi = jjoi.object({
  a: joi.string(),
  b: joi.number(),
  c: joi.boolean(),
  d: joi.number()
}).with('c', ['a']).with('d', ['a', 'b']);

const withSchemaBeforeBefore2019 = {
  type: 'object',
  dependencies: {
    c: ['a'],
    d: ['a', 'b']
  },
  properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' }, d: { type: 'number' } },
  additionalProperties: false
};

const withSchemaBeforeDraft2019 = {
  type: 'object',
  dependentRequired: {
    c: ['a'],
    d: ['a', 'b']
  },
  properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' }, d: { type: 'number' } },
  additionalProperties: false
};
```

### WITHOUT

```javascript
// With a exists, either b or c must not exist
// Failed on { a: '', b: 1 }
const withoutJoi = jjoi.object({
  a: joi.string(),
  b: joi.number(),
  c: joi.boolean(),
  d: joi.number()
}).without('a', ['b', 'c']);

const withoutSchemaDraft7 = {
  type: 'object',
  if: { required: ['a'] },
  then: {
    not: {
      anyOf: [{ required: ['b'] }, { required: ['c'] }]
    }
  },
  properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' }, d: { type: 'number' } },
  additionalProperties: false
};
```
