import config from '@/config';
import express from 'express';
import weatherRoutes from './routes/weatherRoutes';

export interface RoutesImporter {
  basePath?: string
}

export const baseUrl = '/';

export default function (app: express.Application, options: RoutesImporter = {basePath: baseUrl}) {
  const basePath = (options.basePath || '').replace(/\/+$/, '');

  app.use(basePath + '/weather', weatherRoutes());

  if (config.loadSwaggerUIRoute) {
    app.use(basePath + '/swagger', require('./routes/swaggerRoutes').default());
  }
}
