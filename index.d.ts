import Joi from 'joi-17';

declare module Joi2Json {
  /**
   * @type {string}
   */
  export type Mode = 'json' | 'open-api' | 'json-draft-2019-09' | 'json-draft-04';

  /**
   * @param {string} joi - A Joi schema.
   * @param {string} [mode='json'] - json / open-api / json-draft-2019-09 / json-draft-04
   * @param {Record} [sharedSchema={}] - Passed-in object storing shared schemas
   * @returns {any} Converted JSON schema object.
   */
  export function parse(joi: Joi.Schema, mode?: Mode, sharedSchema?: Record<string, any>): any;
}

export default Joi2Json.parse;
