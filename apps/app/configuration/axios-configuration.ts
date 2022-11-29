import axios from "axios";
// constants
import { BASE_STAGING, BASE_LOCAL, BASE_PROD } from "constants/api-routes";

const base_url =
  process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "production"
    ? BASE_PROD
    : process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "preview"
    ? BASE_STAGING
    : BASE_LOCAL;

axios.defaults.baseURL = base_url;

export function setAxiosHeader(token?: string) {
  if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else axios.defaults.headers.common["Authorization"] = "";
}

(async function () {
  setAxiosHeader();
})();

const UNAUTHORIZED = [401];

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return error;
  }
);
