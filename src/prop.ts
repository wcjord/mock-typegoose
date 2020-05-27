import { Schema, Types } from 'mongoose';

import { DecoratorKeys, WhatIsIt } from './internal/constants';
import { schemas } from './internal/data';
import {
  InvalidPropError,
  InvalidTypeError,
  NoMetadataError,
  NotAllVPOPElementsError,
  NotNumberTypeError,
  NotStringTypeError
} from './internal/errors';
import {
  getName,
  isNullOrUndefined,
  getType,
  assertion,
  isWithVirtualPOP,
  includesAllVirtualPOP,
  initProperty,
  isNotDefined,
  isAnRefType,
  createArrayFromDimensions,
  isObject,
  warnMixed,
  mapArrayOptions,
  isWithNumberValidate,
  isNumber,
  isString,
  isWithStringValidate,
  isWithStringTransform,
  mapOptions,
  isPrimitive,
  isNodeJs
} from './internal/utils';
import { logger } from './logSettings';
import { buildSchema } from './typegoose';
import type {
  ArrayPropOptions,
  BasePropOptions,
  DecoratedPropertyMetadata,
  DecoratedPropertyMetadataMap,
  KeyStringAny,
  MapPropOptions,
  PropOptionsForNumber,
  PropOptionsForString,
  VirtualOptions,
  VirtualPopulateMap
} from './types';

/**
 * Base Function for prop & arrayProp
 * @param input All the options needed for prop's
 */
function baseProp(input: DecoratedPropertyMetadata): void {
  const { Type, key, origOptions, target, whatis } = input;
  if (Type === target.constructor) {
    // prevent "infinite" buildSchema loop / Maximum Stack size exceeded
    throw new TypeError(
      'It seems like the type used is the same as the target class, which is currently not supported\n' +
        `Please look at https://github.com/typegoose/typegoose/issues/42 for more information, for now please avoid using it!`
    );
  }

  const existingMapForTarget = Reflect.getOwnMetadata(DecoratorKeys.PropCache, target) as DecoratedPropertyMetadataMap;
  if (isNullOrUndefined(existingMapForTarget)) {
    Reflect.defineMetadata(DecoratorKeys.PropCache, new Map<string, DecoratedPropertyMetadata>(), target);
  }
  const mapForTarget = existingMapForTarget ?? (Reflect.getOwnMetadata(DecoratorKeys.PropCache, target) as DecoratedPropertyMetadataMap);

  mapForTarget.set(key, { origOptions, Type, target, key, whatis });

  logger.debug('Added "%s.%s" to the Decorator Cache', getName(target.constructor), key);
}

/**
 * Function that is the actual processing of the prop's (used for caching)
 * @param input All the options needed for prop's
 */
export function _buildPropMetadata(input: DecoratedPropertyMetadata): void {
  let { Type } = input;
  const { key, origOptions, target, whatis } = input;
  const rawOptions: KeyStringAny = Object.assign({}, origOptions);
  logger.debug('Starting to process "%s.%s"', getName(target), key);

  if (!isNullOrUndefined(rawOptions.type)) {
    logger.info('Prop Option "type" is set to', rawOptions.type);
    Type = getType(rawOptions.type);
    delete rawOptions.type;
  }

  if (isNotDefined(Type)) {
    buildSchema(Type);
  }
  const name = getName(target);

  // allow setting the type asynchronously
  if (!isNullOrUndefined(rawOptions.ref)) {
    rawOptions.ref = getType(rawOptions.ref);
    assertion(
      !isNullOrUndefined(rawOptions.ref),
      new Error('Option "ref" for "%s.%s" was defined with an arrow-function, but the function returned null/undefined!')
    );

    rawOptions.ref = typeof rawOptions.ref === 'string' ? rawOptions.ref : getName(rawOptions.ref);
  }

  if (isWithVirtualPOP(rawOptions)) {
    if (!includesAllVirtualPOP(rawOptions)) {
      throw new NotAllVPOPElementsError(name, key);
    }

    const virtuals: VirtualPopulateMap = new Map(Reflect.getMetadata(DecoratorKeys.VirtualPopulate, target.constructor) ?? []);
    virtuals.set(key, rawOptions);
    Reflect.defineMetadata(DecoratorKeys.VirtualPopulate, virtuals, target.constructor);

    return;
  }

  const schemaProp = initProperty(name, key, whatis);

  if (!isNullOrUndefined(rawOptions.set) || !isNullOrUndefined(rawOptions.get)) {
    assertion(typeof rawOptions.set === 'function', new TypeError(`"${name}.${key}" does not have a set function!`));
    assertion(typeof rawOptions.get === 'function', new TypeError(`"${name}.${key}" does not have a get function!`));

    /*
     * Note:
     * this doesn't have a check if prop & returntype of the function is the same,
     * because it can't be accessed at runtime
     */
    schemaProp[key] = {
      ...schemaProp[key],
      type: Type,
      ...rawOptions
    };

    return;
  }

  // use "Type" if it is an suitable ref-type, otherwise default back to "ObjectId"
  const refType = isAnRefType(Type) ? Type : Schema.Types.ObjectId;
  if ('ref' in rawOptions) {
    assertion(!isNullOrUndefined(rawOptions.ref), new Error('Options "ref" is set, but is undefined/null! (%s.%s)'));
    const ref = rawOptions.ref;
    delete rawOptions.ref;

    switch (whatis) {
      case WhatIsIt.ARRAY:
        schemaProp[key] = createArrayFromDimensions(
          rawOptions,
          {
            ...schemaProp[key][0],
            type: refType,
            ref,
            ...rawOptions
          },
          name,
          key
        );
        break;
      case WhatIsIt.NONE:
        schemaProp[key] = {
          ...schemaProp[key],
          type: refType,
          ref,
          ...rawOptions
        };
        break;
      default:
        throw new TypeError('"ref" is not supported for "%s"! (%s, %s)');
    }

    return;
  }

  const refPath = rawOptions.refPath;
  if (refPath) {
    assertion(typeof refPath === 'string', new TypeError('"refPath" for "%s, %s" should be of type String!'));

    delete rawOptions.refPath;

    switch (whatis) {
      case WhatIsIt.ARRAY:
        schemaProp[key] = createArrayFromDimensions(
          rawOptions,
          {
            ...schemaProp[key][0],
            type: refType,
            refPath,
            ...rawOptions
          },
          name,
          key
        );
        break;
      case WhatIsIt.NONE:
        schemaProp[key] = {
          ...schemaProp[key],
          type: refType,
          refPath,
          ...rawOptions
        };
        break;
      default:
        throw new TypeError('"refPath" is not supported for "%s"! (%s, %s)');
    }

    return;
  }

  const enumOption = rawOptions.enum;
  if (!isNullOrUndefined(enumOption)) {
    // check if the supplied value is already "mongoose-consumeable"
    if (!Array.isArray(enumOption)) {
      if (Type === String || Type === Schema.Types.String) {
        rawOptions.enum = Object.entries<string>(enumOption) // get all key-value pairs of the enum
          // no reverse-filtering because if it is full of strings, there is no reverse mapping
          .map(([enumKey, enumValue]) => {
            // convert key-value pairs to an mongoose-usable enum
            // safeguard, this should never happen because TypeScript only sets "design:type" to "String"
            // if the enum is full of strings
            if (typeof enumValue !== 'string') {
              throw new NotStringTypeError(name, key, enumKey, typeof enumValue);
            }

            return enumValue;
          });
      } else if (Type === Number || Type === Schema.Types.Number) {
        rawOptions.enum = Object.entries<string | number>(enumOption) // get all key-value pairs of the enum
          // filter out the "reverse (value -> name) mappings"
          // https://www.typescriptlang.org/docs/handbook/enums.html#reverse-mappings
          .filter(([enumKey, enumValue], _i, arr) => {
            // safeguard, this should never happen because typescript only sets "design:type" to "Number"
            // if the enum is full of numbers
            if (isNullOrUndefined(enumValue) || arr.findIndex(([k]) => k === enumValue.toString()) <= -1) {
              // if there is no reverse mapping, throw an error
              throw new NotNumberTypeError(name, key, enumKey, typeof enumValue);
            }

            return typeof enumValue === 'number';
          })
          .map(([enumKey, enumValue]) => {
            // convert key-value pairs to an mongoose-useable enum
            if (typeof enumValue !== 'number') {
              throw new NotNumberTypeError(name, key, enumKey, typeof enumValue);
            }

            return enumValue;
          });
      } else {
        // this will happen if the enum type is not "String" or "Number"
        // most likely this error happened because the code got transpiled with babel or "tsc --transpile-only"
        throw new Error(
          `Invalid type used for map!, got: "${Type}" (${name}.${key})` +
            "Is the code transpiled with Babel or 'tsc --transpile-only' or 'ts-node --transpile-only'?\n" +
            'See https://typegoose.github.io/typegoose/docs/decorators/prop/#enum'
        );
      }
    }
  }

  if (!isNullOrUndefined(rawOptions.addNullToEnum)) {
    rawOptions.enum = Array.isArray(rawOptions.enum) ? rawOptions.enum : [];
    rawOptions.enum.push(null);
    delete rawOptions.addNullToEnum;
  }

  {
    // check if Type is actually a real working Type
    if (isNullOrUndefined(Type) || typeof Type !== 'function') {
      throw new InvalidTypeError(getName(target), key, Type);
    }

    // check for validation inconsistencies
    if (isWithStringValidate(rawOptions) && !isString(Type)) {
      throw new NotStringTypeError(name, key);
    }

    // check for transform inconsistencies
    if (isWithStringTransform(rawOptions) && !isString(Type)) {
      throw new NotStringTypeError(name, key);
    }

    if (isWithNumberValidate(rawOptions) && !isNumber(Type)) {
      throw new NotNumberTypeError(name, key);
    }
  }

  /** Is this Type (/Class) in the schemas Map? */
  const isInSchemas = schemas.has(getName(Type));
  if (!isInSchemas && !isPrimitive(Type) && !isObject(Type)) {
    throw new InvalidPropError(Type.name, key); // This seems to be never thrown!
  }

  if (isPrimitive(Type)) {
    if (isObject(Type, true)) {
      warnMixed(target, key);
    }
    switch (whatis) {
      case WhatIsIt.ARRAY:
        schemaProp[key] = {
          ...schemaProp[key][0],
          ...mapArrayOptions(rawOptions, Type, target, key)
        };

        return;
      case WhatIsIt.MAP:
        const mapped = mapOptions(rawOptions, Type, target, key, true);

        schemaProp[key] = {
          ...schemaProp[key],
          ...mapped.outer,
          type: Map,
          of: { type: Type, ...mapped.inner }
        };

        return;
      case WhatIsIt.NONE:
        schemaProp[key] = {
          ...schemaProp[key],
          ...rawOptions,
          type: Type
        };

        return;
      default:
        throw new Error(`"${whatis}"(whatis(primitive)) is invalid for "${name}.${key}"`);
    }
  }

  // If the 'Type' is not a 'Primitive Type' and no subschema was found treat the type as 'Object'
  // so that mongoose can store it as nested document
  if (isObject(Type) && !isInSchemas) {
    warnMixed(target, key);
    logger.warn(
      'if someone can see this message, please open an new issue at https://github.com/typegoose/typegoose/issues with reproduction code for tests'
    );
    schemaProp[key] = {
      ...schemaProp[key],
      ...rawOptions,
      type: Schema.Types.Mixed
    };

    return;
  }

  const virtualSchema = buildSchema(Type);
  switch (whatis) {
    case WhatIsIt.ARRAY:
      schemaProp[key] = {
        ...schemaProp[key][0], // [0] is needed, because "initasArray" adds this (empty)
        ...mapArrayOptions(rawOptions, virtualSchema, target, key, Type)
      };

      return;
    case WhatIsIt.MAP:
      const mapped = mapOptions(rawOptions, virtualSchema, target, key, false, Type);

      schemaProp[key] = {
        ...schemaProp[key],
        ...mapped.outer,
        type: Map,
        of: { type: virtualSchema, ...mapped.inner }
      };

      return;
    case WhatIsIt.NONE:
      schemaProp[key] = {
        ...schemaProp[key],
        ...rawOptions,
        type: virtualSchema
      };

      return;
    default:
      throw new Error(`"${whatis}"(whatis(subSchema)) is invalid for "${name}.${key}"`);
  }
}

/**
 * Set Property Options for the property below
 * @param options Options
 * @param kind Overwrite auto-inferred kind
 * @example
 * ```ts
 * class ClassName {
 *   @prop()
 *   public someprop: string;
 * }
 * ```
 */
function prop(
  options?: BasePropOptions | ArrayPropOptions | MapPropOptions | PropOptionsForNumber | PropOptionsForString | VirtualOptions,
  kind?: WhatIsIt
) {
  if (!isNodeJs()) {
    return (...args: Parameters<typeof prop>) => {
      return (target: any, key: string) => {};
    };
  }
  return (target: any, key: string) => {
    let Type = Reflect.getMetadata(DecoratorKeys.Type, target, key);
    assertion(!isNullOrUndefined(Type), new NoMetadataError(key));

    options = options ?? {};

    if (isNullOrUndefined(kind)) {
      if (
        Type === Array ||
        Type === Types.Array ||
        Type === Schema.Types.Array ||
        Type === Types.DocumentArray ||
        Type === Schema.Types.DocumentArray
      ) {
        kind = WhatIsIt.ARRAY;
      } else if (Type === Map || Type === Types.Map || Type === Schema.Types.Map) {
        kind = WhatIsIt.MAP;
      } else {
        kind = WhatIsIt.NONE;
      }
    }

    if ('refType' in options) {
      options.type = options.refType;
      delete options.refType;
    }

    // soft errors & "type"-alias mapping
    switch (kind) {
      case WhatIsIt.NONE:
        if ('items' in options) {
          logger.warn('You might not want to use option "items" for an non-array @prop type (%s.%s)', getName(target), key);
        }

        if ('of' in options) {
          logger.warn('You might not want to use option "of" for an non-map @prop type (%s.%s)', getName(target), key);
        }
        break;
      case WhatIsIt.ARRAY:
        if ('items' in options) {
          options.type = options.items;
          delete options.items;
        }

        if ('of' in options) {
          logger.warn('You might not want to use option "of" where the "design:type" is "Array" (%s.%s)', getName(target), key);
        }

        // set the "Type" to undefined, if "ref" or "refPath" are defined, otherwise the "refType" will be wrong
        if (('ref' in options || 'refPath' in options) && !('type' in options)) {
          Type = undefined;
        }
        break;
      case WhatIsIt.MAP:
        if ('of' in options) {
          options.type = options.of;
          delete options.of;
        }

        if ('items' in options) {
          logger.warn('You might not want to use option "items" where the "design:type" is "Map" (%s.%s)', getName(target), key);
        }
        break;
    }

    baseProp({
      Type,
      key,
      origOptions: options,
      target,
      whatis: kind
    });
  };
}

/**
 * Set Property(that are Maps) Options for the property below
 * @param options Options for the Map
 *
 * @deprecated use "prop"
 */
function mapProp(options: MapPropOptions) {
  if (!isNodeJs()) {
    logger.warn('running in browser mode');
    return (...args: Parameters<typeof prop>) => {
      return (target: any, key: string) => {};
    };
  }
  return prop(options, WhatIsIt.MAP);
}

/**
 * Set Property(that are Arrays) Options for the property below
 * @param options Options
 *
 * @deprecated use "prop"
 */
function arrayProp(options: ArrayPropOptions) {
  if (!isNodeJs()) {
    return (...args: Parameters<typeof prop>) => {
      return (target: any, key: string) => {};
    };
  }
  return prop(options, WhatIsIt.ARRAY);
}

export { prop, arrayProp, mapProp };

// Export it PascalCased
export { prop as Prop, arrayProp as ArrayProp, mapProp as MapProp };
