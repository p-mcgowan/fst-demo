import { WeatherIdGetPath } from '@/http/nodegen/interfaces';
import { baseUrl, request } from '@/http/nodegen/tests';
import * as supertest from 'supertest';

export class TestWeatherDomain {
  // weatherGet
  //
  public static weatherGetPath(root: string = baseUrl): string {
    return `${root}/weather/`;
  }

  public static weatherGet(root: string = baseUrl): supertest.Test {
    return request.get(this.weatherGetPath(root));
  }

  // weatherIdGet
  //
  public static weatherIdGetPath(id: WeatherIdGetPath['id'], root: string = baseUrl): string {
    return `${root}/weather/${id}`;
  }

  public static weatherIdGet(id: WeatherIdGetPath['id'], root: string = baseUrl): supertest.Test {
    return request.get(this.weatherIdGetPath(id, root));
  }
}
