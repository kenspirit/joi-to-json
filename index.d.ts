import Joi from 'joi';

/**
 * @type {string}
 */
export type Mode = 'json' | 'open-api' | 'open-api-3.1' | 'json-draft-2019-09' | 'json-draft-04';

/**
 * The parser function modifies the schema in-place.
 * @param {any} schema - JSON schema object
 * @param {any} dependency - JOI dependency object
 */
export type LogicalOpParserFn = (schema, dependency) => void;

export interface LogicalOpParserOpts {
  and?: LogicalOpParserFn,
  nand?: LogicalOpParserFn,
  or?: LogicalOpParserFn,
  xor?: LogicalOpParserFn,
  oxor?: LogicalOpParserFn,
  with?: LogicalOpParserFn,
  without?: LogicalOpParserFn
}

export type ParserOptions = false | { logicalOpParser?: LogicalOpParserOpts };

/**
 * @param {Joi.Schema} joi - A Joi schema.
 * @param {string} [mode='json'] - json / open-api / json-draft-2019-09 / json-draft-04
 * @param {Record} [sharedSchema={}] - Passed-in object storing shared schemas
 * @param {ParserOptions} [parserOptions={}] - Passed-in options for parser
 * @returns {any} Converted JSON schema object.
 */
export function parse(joi: typeof Joi.Schema, mode?: Mode, sharedSchema?: Record<string, any>, parserOptions?: ParserOptions): any;

export default parse;
