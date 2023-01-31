import { baseUrl, defaultSetupTeardown, mockAuth, request } from '@/http/nodegen/tests';
import {
  pathId as id,
  responseValidator,
  weatherGetHeaderSearchId,
  weatherGetQueryAppid,
  weatherGetQueryId,
  weatherGetQueryLat,
  weatherGetQueryLon,
  weatherGetQueryQ,
} from '@/http/nodegen/tests/WeatherDomain.data';

defaultSetupTeardown();

describe('WeatherDomain', () => {
  beforeEach(async () => {
    mockAuth(); // Disable auth middleware
  });

  it('can GET /weather/', async () => {
    await request
      .get(`${baseUrl}/weather/`)
      .set({ 'Search-Id': weatherGetHeaderSearchId, 'x-api-key': 'apiKey', 'Authorization': 'apiKey' })
      .query({
        appid: weatherGetQueryAppid,
        q: weatherGetQueryQ,
        id: weatherGetQueryId,
        lat: weatherGetQueryLat,
        lon: weatherGetQueryLon,
      })
      .expect(({ status, body }) => {
        expect(status).toBe(200);

        const validated = responseValidator('weatherGet200', body);
        expect(validated.error).toBe(undefined);
      });
  });

  it('can GET /weather/{id}', async () => {
    await request
      .get(`${baseUrl}/weather/${id}`)
      .set({ 'x-api-key': 'apiKey', 'Authorization': 'apiKey' })
      .expect(({ status, body }) => {
        expect(status).toBe(200);

        const validated = responseValidator('weatherIdGet200', body);
        expect(validated.error).toBe(undefined);
      });
  });
});
