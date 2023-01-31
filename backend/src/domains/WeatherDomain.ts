import {
  Weather,
  WeatherFull,
  WeatherGetHeaders,
  WeatherGetQuery,
  WeatherIdGetPath,
} from '@/http/nodegen/interfaces';

import { WeatherDomainInterface } from '@/http/nodegen/domainInterfaces/WeatherDomainInterface';
import { JwtAccess } from '@/http/nodegen/interfaces';
import NodegenRequest from '../http/interfaces/NodegenRequest';

import WeatherDomainMock from './__mocks__/WeatherDomainMock';

class WeatherDomain implements WeatherDomainInterface {
  /**
   * Operation ID: weatherGet
   * Path middleware used see: WeatherDomainInterface.weatherGet
   * Summary: Get weather
   * Description: Query with varying content
   **/
  public async weatherGet(
    headers: WeatherGetHeaders,
    jwtData: JwtAccess,
    query: WeatherGetQuery,
    req: NodegenRequest
  ): Promise<Weather> {
    return WeatherDomainMock.weatherGet(headers, jwtData, query, req);
  }

  /**
   * Operation ID: weatherIdGet
   * Path middleware used see: WeatherDomainInterface.weatherIdGet
   * Summary: Get weather
   * Description: Query with varying content
   **/
  public async weatherIdGet(
    jwtData: JwtAccess | undefined,
    params: WeatherIdGetPath
  ): Promise<WeatherFull> {
    return WeatherDomainMock.weatherIdGet(jwtData, params);
  }
}

export default new WeatherDomain();
