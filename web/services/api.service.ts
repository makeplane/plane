import axios from "axios";
import Cookies from "js-cookie";

const unAuthorizedStatus = [401];
const nonValidatedRoutes = [
  "/",
  "/magic-sign-in",
  "/reset-password",
  "/workspace-member-invitation",
  "/sign-up",
  "/m/",
];

const validateRouteCheck = (route: string): boolean => {
  let validationToggle = false;

  let routeCheck = false;
  nonValidatedRoutes.forEach((_route: string) => {
    if (route.includes(_route)) {
      routeCheck = true;
    }
  });

  if (routeCheck) validationToggle = true;
  return validationToggle;
};

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status }: any = error.response;
    if (!validateRouteCheck(window.location.pathname)) {
      if (unAuthorizedStatus.includes(status)) {
        Cookies.remove("refreshToken", { path: "/" });
        Cookies.remove("accessToken", { path: "/" });
        window.location.href = `/?next_url=${window.location.pathname}`;
      }
    }
    return Promise.reject(error);
  }
);

abstract class APIService {
  protected baseURL: string;
  protected headers: any = {};

  constructor(baseURL: string) {
    this.baseURL = baseURL;
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
      Authorization: `Bearer ${this.getAccessToken()}`,
    };
  }

  getWithoutBase(url: string, config = {}): Promise<any> {
    return axios({
      method: "get",
      url: url,
      headers: this.getAccessToken() ? this.getHeaders() : {},
      ...config,
    });
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

  mediaUpload(url: string, data = {}, config = {}): Promise<any> {
    return axios({
      method: "post",
      url: this.baseURL + url,
      data,
      headers: this.getAccessToken()
        ? { ...this.getHeaders(), "Content-Type": "multipart/form-data" }
        : {},
      ...config,
    });
  }

  request(config = {}) {
    return axios(config);
  }
}

export default APIService;
