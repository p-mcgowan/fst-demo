import { mockItGenerator } from 'generate-it-mockers';

import { JwtAccess } from '@/http/nodegen/interfaces/JwtAccess';

import { Weather } from '@/http/nodegen/interfaces/Weather';
import { WeatherFull } from '@/http/nodegen/interfaces/WeatherFull';
import { WeatherGetHeaders } from '@/http/nodegen/interfaces/WeatherGetHeaders';
import { WeatherGetQuery } from '@/http/nodegen/interfaces/WeatherGetQuery';
import { WeatherIdGetPath } from '@/http/nodegen/interfaces/WeatherIdGetPath';

class WeatherDomainMock {
  // Operation ID: weatherGet
  async weatherGet(
    headers: WeatherGetHeaders,
    jwtData: JwtAccess,
    query: WeatherGetQuery,
    req: any
  ): Promise<Weather> {
    return mockItGenerator({
      type: 'object',
      required: ['coord'],
      properties: {
        coord: {
          type: 'object',
          properties: { lon: { type: 'number' }, lat: { type: 'number' } },
        },
        weather: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              main: { type: 'string' },
              description: { type: 'string' },
              icon: { type: 'string' },
            },
          },
        },
        base: { type: 'string' },
        main: {
          type: 'object',
          properties: {
            temp: { type: 'number' },
            pressure: { type: 'number' },
            humidity: { type: 'number' },
            temp_min: { type: 'number' },
            temp_max: { type: 'number' },
            sea_level: { type: 'number' },
            grnd_level: { type: 'number' },
          },
        },
        wind: {
          type: 'object',
          properties: {
            speed: { type: 'number' },
            deg: { type: 'number' },
            clouds: { type: 'object', properties: { all: { type: 'number' } } },
          },
        },
        dt: { type: 'number' },
        sys: {
          type: 'object',
          properties: {
            message: { type: 'number' },
            country: { type: 'string' },
            sunrise: { type: 'number' },
            sunset: { type: 'number' },
          },
        },
        id: { type: 'number' },
        name: { type: 'string' },
        cod: { type: 'number' },
      },
    });
  }

  // Operation ID: weatherIdGet
  async weatherIdGet(
    jwtData: JwtAccess | undefined,
    pathParams: WeatherIdGetPath
  ): Promise<WeatherFull> {
    return mockItGenerator({
      type: 'object',
      required: ['coord', 'name'],
      properties: {
        coord: {
          type: 'object',
          properties: { lon: { type: 'number' }, lat: { type: 'number' } },
        },
        weather: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              main: { type: 'string' },
              description: { type: 'string' },
              icon: { type: 'string' },
            },
          },
        },
        base: { type: 'string' },
        main: {
          type: 'object',
          properties: {
            temp: { type: 'number' },
            pressure: { type: 'number' },
            humidity: { type: 'number' },
            temp_min: { type: 'number' },
            temp_max: { type: 'number' },
            sea_level: { type: 'number' },
            grnd_level: { type: 'number' },
          },
        },
        wind: {
          type: 'object',
          properties: {
            speed: { type: 'number' },
            deg: { type: 'number' },
            clouds: { type: 'object', properties: { all: { type: 'number' } } },
          },
        },
        dt: { type: 'number' },
        sys: {
          type: 'object',
          properties: {
            message: { type: 'number' },
            country: { type: 'string' },
            sunrise: { type: 'number' },
            sunset: { type: 'number' },
          },
        },
        id: { type: 'string' },
        name: { type: 'string' },
        cod: { type: 'number' },
      },
    });
  }
}
export default new WeatherDomainMock();
