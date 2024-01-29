import axios from "axios";
import Cookies from "js-cookie";

export abstract class APIService {
  protected baseURL: string;
  protected headers: any = {};

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setRefreshToken(token: string) {
    Cookies.set("refresh_token", token, { expires: 30 });
  }

  getRefreshToken() {
    return Cookies.get("refresh_token");
  }

  purgeRefreshToken() {
    Cookies.remove("refresh_token", { path: "/" });
  }

  setAccessToken(token: string) {
    Cookies.set("access_token", token, { expires: 30 });
  }

  getAccessToken() {
    console.log("access_token", Cookies.get("access_token"));

    return Cookies.get("access_token");
  }

  purgeAccessToken() {
    Cookies.remove("access_token", { path: "/" });
  }

  getHeaders() {
    return {
      Authorization: `Bearer ${this.getAccessToken()}`,
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
