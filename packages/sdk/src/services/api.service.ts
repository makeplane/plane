import axios, { AxiosInstance } from "axios";
// types
import { ClientOptions } from "@/types/types";

export abstract class APIService {
  private axiosInstance: AxiosInstance;

  constructor(options: ClientOptions) {
    const { baseURL, apiToken, bearerToken } = options;
    const headers = {
      ...(apiToken && { "X-API-Key": apiToken }),
      ...(bearerToken && { "Authorization": `Bearer ${bearerToken}` }),
    };
    this.axiosInstance = axios.create({
      baseURL,
      headers,
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.log("401 error");
        }
        return Promise.reject(error);
      }
    );
  }

  get(url: string, config = {}) {
    return this.axiosInstance.get(url, config);
  }

  post(url: string, data = {}, config = {}) {
    return this.axiosInstance.post(url, data, config);
  }

  put(url: string, data = {}, config = {}) {
    return this.axiosInstance.put(url, data, config);
  }

  patch(url: string, data = {}, config = {}) {
    return this.axiosInstance.patch(url, data, config);
  }

  delete(url: string, data?: any, config = {}) {
    return this.axiosInstance.delete(url, { data, ...config });
  }

  request(config = {}) {
    return this.axiosInstance(config);
  }
}
