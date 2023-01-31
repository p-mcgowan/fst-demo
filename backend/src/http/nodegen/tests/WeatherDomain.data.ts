import * as Joi from 'joi';
import { mockItGenerator } from 'generate-it-mockers';

export const weatherGetQueryAppid = mockItGenerator({ type: 'string' });

export const weatherGetQueryQ = mockItGenerator({ type: 'string' });

export const weatherGetQueryId = mockItGenerator({ type: 'number' });

export const weatherGetQueryLat = mockItGenerator({ type: 'number' });

export const weatherGetQueryLon = mockItGenerator({ type: 'number' });

export const weatherGetHeaderSearchId = mockItGenerator({ type: 'string', pattern: '^Bearer .+$' });

export const pathId = mockItGenerator({ type: 'string' });

export const validationSchemas: Record<string, Joi.AnySchema> = {
  weatherGet200: Joi.object({
    coord: Joi.object({ lon: Joi.number().allow(null), lat: Joi.number().allow(null) }).allow(null),
    weather: Joi.array().items(
      Joi.object({
        id: Joi.number().allow(null),
        main: Joi.string().allow('').allow(null),
        description: Joi.string().allow('').allow(null),
        icon: Joi.string().allow('').allow(null),
      }).allow(null)
    ),
    base: Joi.string().allow('').allow(null),
    main: Joi.object({
      temp: Joi.number().allow(null),
      pressure: Joi.number().allow(null),
      humidity: Joi.number().allow(null),
      temp_min: Joi.number().allow(null),
      temp_max: Joi.number().allow(null),
      sea_level: Joi.number().allow(null),
      grnd_level: Joi.number().allow(null),
    }).allow(null),
    wind: Joi.object({
      speed: Joi.number().allow(null),
      deg: Joi.number().allow(null),
      clouds: Joi.object({ all: Joi.number().allow(null) }).allow(null),
    }).allow(null),
    dt: Joi.number().allow(null),
    sys: Joi.object({
      message: Joi.number().allow(null),
      country: Joi.string().allow('').allow(null),
      sunrise: Joi.number().allow(null),
      sunset: Joi.number().allow(null),
    }).allow(null),
    id: Joi.number().allow(null),
    name: Joi.string().allow('').allow(null),
    cod: Joi.number().allow(null),
  }).allow(null),
  weatherGetSuccess: Joi.object({
    coord: Joi.object({ lon: Joi.number().allow(null), lat: Joi.number().allow(null) }).allow(null),
    weather: Joi.array().items(
      Joi.object({
        id: Joi.number().allow(null),
        main: Joi.string().allow('').allow(null),
        description: Joi.string().allow('').allow(null),
        icon: Joi.string().allow('').allow(null),
      }).allow(null)
    ),
    base: Joi.string().allow('').allow(null),
    main: Joi.object({
      temp: Joi.number().allow(null),
      pressure: Joi.number().allow(null),
      humidity: Joi.number().allow(null),
      temp_min: Joi.number().allow(null),
      temp_max: Joi.number().allow(null),
      sea_level: Joi.number().allow(null),
      grnd_level: Joi.number().allow(null),
    }).allow(null),
    wind: Joi.object({
      speed: Joi.number().allow(null),
      deg: Joi.number().allow(null),
      clouds: Joi.object({ all: Joi.number().allow(null) }).allow(null),
    }).allow(null),
    dt: Joi.number().allow(null),
    sys: Joi.object({
      message: Joi.number().allow(null),
      country: Joi.string().allow('').allow(null),
      sunrise: Joi.number().allow(null),
      sunset: Joi.number().allow(null),
    }).allow(null),
    id: Joi.number().allow(null),
    name: Joi.string().allow('').allow(null),
    cod: Joi.number().allow(null),
  }).allow(null),
  weatherGet400: Joi.object({}),
  weatherGet404: Joi.object({}),
  weatherIdGet200: Joi.object({
    coord: Joi.object({ lon: Joi.number().allow(null), lat: Joi.number().allow(null) }).allow(null),
    weather: Joi.array().items(
      Joi.object({
        id: Joi.number().allow(null),
        main: Joi.string().allow('').allow(null),
        description: Joi.string().allow('').allow(null),
        icon: Joi.string().allow('').allow(null),
      }).allow(null)
    ),
    base: Joi.string().allow('').allow(null),
    main: Joi.object({
      temp: Joi.number().allow(null),
      pressure: Joi.number().allow(null),
      humidity: Joi.number().allow(null),
      temp_min: Joi.number().allow(null),
      temp_max: Joi.number().allow(null),
      sea_level: Joi.number().allow(null),
      grnd_level: Joi.number().allow(null),
    }).allow(null),
    wind: Joi.object({
      speed: Joi.number().allow(null),
      deg: Joi.number().allow(null),
      clouds: Joi.object({ all: Joi.number().allow(null) }).allow(null),
    }).allow(null),
    dt: Joi.number().allow(null),
    sys: Joi.object({
      message: Joi.number().allow(null),
      country: Joi.string().allow('').allow(null),
      sunrise: Joi.number().allow(null),
      sunset: Joi.number().allow(null),
    }).allow(null),
    id: Joi.string().allow('').allow(null),
    name: Joi.string().allow('').allow(null),
    cod: Joi.number().allow(null),
  }).allow(null),
  weatherIdGetSuccess: Joi.object({
    coord: Joi.object({ lon: Joi.number().allow(null), lat: Joi.number().allow(null) }).allow(null),
    weather: Joi.array().items(
      Joi.object({
        id: Joi.number().allow(null),
        main: Joi.string().allow('').allow(null),
        description: Joi.string().allow('').allow(null),
        icon: Joi.string().allow('').allow(null),
      }).allow(null)
    ),
    base: Joi.string().allow('').allow(null),
    main: Joi.object({
      temp: Joi.number().allow(null),
      pressure: Joi.number().allow(null),
      humidity: Joi.number().allow(null),
      temp_min: Joi.number().allow(null),
      temp_max: Joi.number().allow(null),
      sea_level: Joi.number().allow(null),
      grnd_level: Joi.number().allow(null),
    }).allow(null),
    wind: Joi.object({
      speed: Joi.number().allow(null),
      deg: Joi.number().allow(null),
      clouds: Joi.object({ all: Joi.number().allow(null) }).allow(null),
    }).allow(null),
    dt: Joi.number().allow(null),
    sys: Joi.object({
      message: Joi.number().allow(null),
      country: Joi.string().allow('').allow(null),
      sunrise: Joi.number().allow(null),
      sunset: Joi.number().allow(null),
    }).allow(null),
    id: Joi.string().allow('').allow(null),
    name: Joi.string().allow('').allow(null),
    cod: Joi.number().allow(null),
  }).allow(null),
  weatherIdGet400: Joi.object({}),
  weatherIdGet404: Joi.object({}),
};

/**
 * Default, basic validator which checks if the schema returned matches
 * the schema defined in the API spec.
 * This is just a starting point for the tests, but this should be replaced by more specific,
 * targeted test cases.
 *
 * @param {string}  responseKey  The response key
 * @param {any}     schema       The schema
 */
export const responseValidator = (responseKey: string, schema: any): { error?: Joi.ValidationError } => {
  return validationSchemas[responseKey].validate(schema);
};
