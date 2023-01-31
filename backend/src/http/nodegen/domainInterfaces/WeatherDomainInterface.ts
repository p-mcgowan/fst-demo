import {
  Weather,
  WeatherFull,
  WeatherGetHeaders,
  WeatherGetQuery,
  WeatherIdGetPath,
} from '@/http/nodegen/interfaces';
import { JwtAccess } from '@/http/nodegen/interfaces';
import NodegenRequest from '@/http/interfaces/NodegenRequest';

export interface WeatherDomainInterface {
  /**
   * Operation ID: weatherGet
   * Summary: Get weather
   * Description: Query with varying content
   * Security header(s): ['x-api-key', 'Authorization']
   **/
  weatherGet(
    headers: WeatherGetHeaders,
    jwtData: JwtAccess,
    query: WeatherGetQuery,
    req: any
  ): Promise<Weather>;

  /**
   * Operation ID: weatherIdGet
   * Summary: Get weather
   * Description: Query with varying content
   * Security header(s): ['x-api-key', 'Authorization']
   * Permission string: getWeatherDetail
   **/
  weatherIdGet(
    jwtData: JwtAccess | undefined,
    params: WeatherIdGetPath
  ): Promise<WeatherFull>;
}
