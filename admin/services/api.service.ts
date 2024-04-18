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

  get<T>(url: string, params = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, { params });
  }

  post<T>(url: string, data: Partial<T> = {}, config = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  put<T>(url: string, data: Partial<T> = {}, config = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  patch<T>(url: string, data: Partial<T> = {}, config = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch<T>(url, data, config);
  }

  delete<T>(url: string, data?: Partial<T>, config = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, { data, ...config });
  }

  request<T>(config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance(config);
  }
}
