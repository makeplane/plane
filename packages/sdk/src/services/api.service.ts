import axios, { AxiosInstance } from "axios";
// types
import { ClientOptions } from "@/types/types";

export abstract class APIService {
  private axiosInstance: AxiosInstance;

  constructor(options: ClientOptions) {
    const { baseURL, apiToken, bearerToken } = options;
    const headers = {
      ...(apiToken && { "X-API-Key": apiToken }),
      ...(bearerToken && { Authorization: `Bearer ${bearerToken}` }),
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
      async (error) => {
        if (error.response && error.response.status === 401) {
          console.log("401 error");
        }
        if (
          error.response.status === 502 ||
          error.response.status === 503 ||
          error.response.status === 504 ||
          error.code === "ECONNRESET"
        ) {
          // Initialize retry count if not present
          const retryCount = (error.config.__retryCount || 0) + 1;
          const maxRetries = 10;

          if (retryCount <= maxRetries) {
            // Add retry count to config for tracking
            error.config.__retryCount = retryCount;
            console.log(`Retrying request (attempt ${retryCount}/${maxRetries})...`);

            // Here we have to wait for retry after 20 seconds
            await new Promise((resolve) => setTimeout(resolve, 20000));
            return this.axiosInstance(error.config);
          } else {
            console.log(`Max retry attempts (${maxRetries}) reached, failing request`);
            return Promise.reject(new Error(`Request failed after ${maxRetries} retry attempts`));
          }
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
