import express from 'express';
import Router from 'express-promise-router';

import { celebrate } from 'celebrate';
import accessTokenMiddleware from '../middleware/accessTokenMiddleware';

import permissionMiddleware from '../middleware/permissionMiddleware';

import weatherValidators from '../validators/weatherValidators';
import WeatherDomain from '../../../domains/WeatherDomain';
import weatherTransformOutputs from '../transformOutputs/weatherTransformOutput';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default function () {
  const router = Router();

  /**
   * Operation ID: weatherGet
   * Summary: Get weather
   * Description: Query with varying content
   */

  router.get(
    '/',
    accessTokenMiddleware([
      'x-api-key',
      'Authorization',
    ]) /* Validate request security tokens */,

    celebrate(
      weatherValidators.weatherGet
    ) /* Validate the request data and return validation errors, options passed in via x-joi-options */,

    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await WeatherDomain.weatherGet(
          req.headers,
          req.jwtData,
          req.query,
          req
        ),
        200,
        undefined,
        weatherTransformOutputs.weatherGet
      );
    }
  );

  /**
   * Operation ID: weatherIdGet
   * Summary: Get weather
   * Description: Query with varying content
   */

  router.get(
    '/:id',
    accessTokenMiddleware(['x-api-key', 'Authorization'], {
      passThruWithoutJWT: true,
    }) /* Validate request security tokens */,
    permissionMiddleware(
      'getWeatherDetail'
    ) /* Check permission of the incoming user */,
    celebrate(
      weatherValidators.weatherIdGet
    ) /* Validate the request data and return validation errors, options passed in via x-joi-options */,

    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await WeatherDomain.weatherIdGet(req.jwtData, req.params),
        200,
        undefined,
        weatherTransformOutputs.weatherIdGet
      );
    }
  );

  return router;
}
