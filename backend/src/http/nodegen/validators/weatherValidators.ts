import { Joi } from 'celebrate';

export default {
  weatherGet: {
    headers: Joi.object({
      'Search-Id': Joi.string()
        .allow('')
        .regex(/^Bearer .+$/),
    }).unknown(true),
    query: Joi.object({
      appid: Joi.string().required(),
      q: Joi.string().allow(''),
      id: Joi.number(),
      lat: Joi.number(),
      lon: Joi.number(),
    }),
  },

  weatherIdGet: {
    params: Joi.object({ id: Joi.string().required() }),
  },
};
