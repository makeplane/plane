import axios, { AxiosInstance, AxiosRequestConfig, AxiosHeaders } from "axios";
// types
import { wait } from "@/helpers/delay";
import HMACSigner from "@/helpers/hmac-sign";
import { logger } from "@/logger";
import { ClientOptions } from "@/types";

export abstract class APIService {
  private axiosInstance: AxiosInstance;
  private hmacPrivateKey: string;
  private serviceName: string;

  constructor(options: ClientOptions) {
    const { baseURL, hmacPrivateKey, serviceName } = options;
    this.hmacPrivateKey = hmacPrivateKey;
    this.serviceName = serviceName;
    this.axiosInstance = axios.create({
      baseURL,
      headers: {},
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add HMAC headers
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Create the HMAC signature
        const hmacHeaders = HMACSigner.generateHeaders(
          this.hmacPrivateKey,
          this.serviceName,
          config.method as string,
          config.url as string
        );

        // Add the HMAC headers
        config.headers = new AxiosHeaders({
          ...config.headers,
          ...hmacHeaders,
        });

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          logger.error("401 error");
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
            logger.info(`Retrying request (attempt ${retryCount}/${maxRetries})...`);
            // Here we have to wait for retry after 20 seconds
            await wait(20000);
            return this.axiosInstance(error.config);
          } else {
            logger.error(`Max retry attempts (${maxRetries}) reached, failing request`);
            return Promise.reject(new Error(`Request failed after ${maxRetries} retry attempts`));
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get(url: string, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.get(url, config);
  }

  post(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.post(url, data, config);
  }

  put(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.put(url, data, config);
  }

  patch(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.patch(url, data, config);
  }

  delete(url: string, data?: any, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.delete(url, { data, ...config });
  }

  request(config = {}) {
    return this.axiosInstance(config);
  }
}
