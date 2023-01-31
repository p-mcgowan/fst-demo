export interface WeatherGetQuery {
  /**
   * Grab a free API key from here: https://openweathermap.org/price
   */
  appid: string;
  /**
   * City ID based on city.list.json.gz can be downloaded here
   * http://bulk.openweathermap.org/sample/
   */
  id?: number;
  /**
   * Needs to be paired with lon
   */
  lat?: number;
  /**
   * Needs to be paired with lat
   */
  lon?: number;
  /**
   * q city name and country code divided by comma, use ISO 3166 country codes. for example:
   * q=London,uk or just q=London
   */
  q?: string;
}
