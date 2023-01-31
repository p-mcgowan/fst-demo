export default {
  'jwtToken': {
    'type': "apiKey",
    'name': "Authorization",
    'in': "header",
    },
  'apiKeyAdmin': {
    'type': "apiKey",
    'name': "x-api-key",
    'in': "header",
    },
  'apiToken': {
    'type': "http",
    'scheme': "bearer",
    },
  'basic': {
    'type': "http",
    'scheme': "basic",
    },
  };
