import app from '@/app';
import { NodegenRequest } from '@/http/nodegen/interfaces';
import { baseUrl as root } from '@/http/nodegen/routesImporter';
import { default as AccessTokenService } from '@/services/AccessTokenService';
import { NextFunction, RequestHandler, Response } from 'express';
import { default as supertest } from 'supertest';

// sucks these can't be on-demand - jest needs to hoist them so that anything importing them gets the mock.
jest.mock('morgan', () => () => (req: NodegenRequest, res: Response, next: NextFunction) => next());
jest.mock('@/http/nodegen/middleware/asyncValidationMiddleware', () => () => (req: NodegenRequest, res: Response, next: NextFunction) => next());

export const baseUrl = root.replace(/\/*$/, '');
export let request: supertest.SuperTest<supertest.Test>;

// don't call twice...
let setupCalled = false;

export const defaultSetupTeardown = () => {
  if (setupCalled) {
    return;
  }
  setupCalled = true;

  beforeAll(async () => {
    request = supertest((await app(0)).expressApp);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  };

/**
 * Auth middleware mocker
 *
 * By default, a simple pass-through middleware is used (req, res, next) => next()
 *
 * If your auth flow requires side-effects (eg setting req.user = 'something') then
 * you will want to pass in a custom middleware mocker to handle that case
 *
 * @param {RequestHandler}  middleware  Replaces AccessTokenService.validateRequest
 */
export const mockAuth = (middleware?: RequestHandler) => {
  jest
    .spyOn(AccessTokenService, 'validateRequest')
    .mockImplementation(
      middleware ||
        ((req: NodegenRequest, res: Response, next: NextFunction) => next())
    );
};

export { TestWeatherDomain } from './WeatherDomain';
