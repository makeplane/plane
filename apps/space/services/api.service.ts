// axios
import axios from "axios";
// js cookie
import Cookies from "js-cookie";

const baseToken: string | null = "secret_token";

abstract class APIService {
  protected baseURL: string;
  protected headers: any = {};

  constructor(baseURL: string | null = null) {
    this.baseURL = baseURL != null ? baseURL : "http://localhost:8000";
  }

  setRefreshToken(token: string) {
    Cookies.set("refreshToken", token);
  }

  getRefreshToken() {
    return Cookies.get("refreshToken");
  }

  purgeRefreshToken() {
    Cookies.remove("refreshToken", { path: "/" });
  }

  setAccessToken(token: string) {
    Cookies.set("accessToken", token);
  }

  getAccessToken() {
    return Cookies.get("accessToken");
  }

  purgeAccessToken() {
    Cookies.remove("accessToken", { path: "/" });
  }

  getHeaders() {
    return {
      Authorization: `Bearer ${baseToken != null ? baseToken : this.getAccessToken()}`,
    };
  }

  get(url: string, config = {}): Promise<any> {
    return axios({
      method: "get",
      url: this.baseURL + url,
      headers: this.getAccessToken() ? this.getHeaders() : {},
      ...config,
    });
  }

  post(url: string, data = {}, config = {}): Promise<any> {
    return axios({
      method: "post",
      url: this.baseURL + url,
      data,
      headers: this.getAccessToken() ? this.getHeaders() : {},
      ...config,
    });
  }

  put(url: string, data = {}, config = {}): Promise<any> {
    return axios({
      method: "put",
      url: this.baseURL + url,
      data,
      headers: this.getAccessToken() ? this.getHeaders() : {},
      ...config,
    });
  }

  patch(url: string, data = {}, config = {}): Promise<any> {
    return axios({
      method: "patch",
      url: this.baseURL + url,
      data,
      headers: this.getAccessToken() ? this.getHeaders() : {},
      ...config,
    });
  }

  delete(url: string, data?: any, config = {}): Promise<any> {
    return axios({
      method: "delete",
      url: this.baseURL + url,
      data: data,
      headers: this.getAccessToken() ? this.getHeaders() : {},
      ...config,
    });
  }

  request(config = {}) {
    return axios(config);
  }
}

export default APIService;
