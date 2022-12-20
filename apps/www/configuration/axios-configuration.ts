import axios from "axios";
// cookie
import cookie from "js-cookie";
// constants
import { BASE_STAGING, BASE_LOCAL, BASE_PROD } from "@constants/api-routes";


if (process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "production") {
  axios.defaults.baseURL = BASE_PROD;
} else if (process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "preview") {
  axios.defaults.baseURL = BASE_STAGING;
} else {
  axios.defaults.baseURL = BASE_LOCAL;
}

const UNAUTHORIZED = [401];
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status }: any = error.response;
    if (UNAUTHORIZED.includes(status)) {
      // logout();
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
