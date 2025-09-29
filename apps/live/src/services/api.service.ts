import axios, { AxiosInstance } from "axios";
import { env } from "@/env";

export abstract class APIService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;
  private header: Record<string, string> = {};

  constructor(baseURL?: string) {
    this.baseURL = baseURL || env.API_BASE_URL;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      withCredentials: true,
      timeout: 20000,
    });
  }

  setHeader(key: string, value: string) {
    this.header[key] = value;
  }

  getHeader() {
    return this.header;
  }

  get(url: string, params = {}, config = {}) {
    return this.axiosInstance.get(url, {
      ...params,
      ...config,
    });
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

  delete(url: string, data?: Record<string, unknown> | null | string, config = {}) {
    return this.axiosInstance.delete(url, { data, ...config });
  }

  request(config = {}) {
    return this.axiosInstance(config);
  }
}
