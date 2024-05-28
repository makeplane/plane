import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
// store
// import { rootStore } from "@/lib/store-context";

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
    // this.axiosInstance.interceptors.response.use(
    //   (response) => response,
    //   (error) => {
    //     const store = rootStore;
    //     if (error.response && error.response.status === 401 && store.user.currentUser) store.user.reset();
    //     return Promise.reject(error);
    //   }
    // );
  }

  get<ResponseType>(url: string, params = {}): Promise<AxiosResponse<ResponseType>> {
    return this.axiosInstance.get(url, { params });
  }

  post<RequestType, ResponseType>(url: string, data: RequestType, config = {}): Promise<AxiosResponse<ResponseType>> {
    return this.axiosInstance.post(url, data, config);
  }

  put<RequestType, ResponseType>(url: string, data: RequestType, config = {}): Promise<AxiosResponse<ResponseType>> {
    return this.axiosInstance.put(url, data, config);
  }

  patch<RequestType, ResponseType>(url: string, data: RequestType, config = {}): Promise<AxiosResponse<ResponseType>> {
    return this.axiosInstance.patch(url, data, config);
  }

  delete<RequestType>(url: string, data?: RequestType, config = {}) {
    return this.axiosInstance.delete(url, { data, ...config });
  }

  request<T>(config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance(config);
  }
}
