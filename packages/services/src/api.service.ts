import type { AxiosInstance, AxiosRequestConfig } from "axios";
import axios from "axios";

/**
 * Abstract base class for making HTTP requests using axios
 * @abstract
 */
export abstract class APIService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  /**
   * Creates an instance of APIService
   * @param {string} baseURL - The base URL for all HTTP requests
   */
  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({
      baseURL,
      withCredentials: true,
    });
  }

  /**
   * Makes a GET request to the specified URL
   * @param {string} url - The endpoint URL
   * @param {object} [params={}] - URL parameters
   * @param {AxiosRequestConfig} [config={}] - Additional axios configuration
   * @returns {Promise} Axios response promise
   */
  get(url: string, params = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.get(url, {
      ...params,
      ...config,
    });
  }

  /**
   * Makes a POST request to the specified URL
   * @param {string} url - The endpoint URL
   * @param {object} [data={}] - Request body data
   * @param {AxiosRequestConfig} [config={}] - Additional axios configuration
   * @returns {Promise} Axios response promise
   */
  post(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.post(url, data, config);
  }

  /**
   * Makes a PUT request to the specified URL
   * @param {string} url - The endpoint URL
   * @param {object} [data={}] - Request body data
   * @param {AxiosRequestConfig} [config={}] - Additional axios configuration
   * @returns {Promise} Axios response promise
   */
  put(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.put(url, data, config);
  }

  /**
   * Makes a PATCH request to the specified URL
   * @param {string} url - The endpoint URL
   * @param {object} [data={}] - Request body data
   * @param {AxiosRequestConfig} [config={}] - Additional axios configuration
   * @returns {Promise} Axios response promise
   */
  patch(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.patch(url, data, config);
  }

  /**
   * Makes a DELETE request to the specified URL
   * @param {string} url - The endpoint URL
   * @param {any} [data] - Request body data
   * @param {AxiosRequestConfig} [config={}] - Additional axios configuration
   * @returns {Promise} Axios response promise
   */
  delete(url: string, data?: any, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.delete(url, { data, ...config });
  }

  /**
   * Makes a custom request with the provided configuration
   * @param {object} [config={}] - Axios request configuration
   * @returns {Promise} Axios response promise
   */
  request(config = {}) {
    return this.axiosInstance(config);
  }
}
