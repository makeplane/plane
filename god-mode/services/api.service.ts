import axios, { AxiosInstance } from "axios";

export abstract class APIService {
  protected baseURL: string;
  axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({
      baseURL,
      withCredentials: true,
    });
  }

  get(url: string, config = {}): Promise<any> {
    return this.axiosInstance({
      method: "get",
      url,
      ...config,
    });
  }

  post(url: string, data = {}, config = {}): Promise<any> {
    return this.axiosInstance({
      method: "post",
      url,
      data,
      ...config,
    });
  }

  put(url: string, data = {}, config = {}): Promise<any> {
    return this.axiosInstance({
      method: "put",
      url,
      data,
      ...config,
    });
  }

  patch(url: string, data = {}, config = {}): Promise<any> {
    return this.axiosInstance({
      method: "patch",
      url,
      data,
      ...config,
    });
  }

  delete(url: string, data?: any, config = {}): Promise<any> {
    return this.axiosInstance({
      method: "delete",
      url,
      data: data,
      ...config,
    });
  }

  request(config = {}) {
    return axios(config);
  }
}
