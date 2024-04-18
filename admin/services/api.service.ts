import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

export abstract class APIService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({
      baseURL,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response && error.response.status === 401) window.location.href = "/login";
        return Promise.reject(error.response?.data ?? error);
      }
    );
  }

  get<ResponseType>(url: string, params = {}): Promise<AxiosResponse<ResponseType>> {
    return this.axiosInstance.get<ResponseType>(url, { params });
  }

  post<RequestType, ResponseType>(url: string, data: RequestType, config = {}): Promise<AxiosResponse<ResponseType>> {
    return this.axiosInstance.post<ResponseType>(url, data, config);
  }

  put<RequestType, ResponseType>(url: string, data: RequestType, config = {}): Promise<AxiosResponse<ResponseType>> {
    return this.axiosInstance.put<ResponseType>(url, data, config);
  }

  patch<RequestType, ResponseType>(url: string, data: RequestType, config = {}): Promise<AxiosResponse<ResponseType>> {
    return this.axiosInstance.patch<ResponseType>(url, data, config);
  }

  delete<RequestType>(url: string, data?: RequestType, config = {}) {
    return this.axiosInstance.delete(url, { data, ...config });
  }

  request<T>(config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance(config);
  }
}
