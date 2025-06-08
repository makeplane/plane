import axios, { AxiosInstance } from "axios";
import { ICsrfTokenData, IEmailCheckData, IEmailCheckResponse, IUser } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";

export class MobileAuthService {
  axiosInstance: AxiosInstance;
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
    });
  }

  requestCSRFToken = async (): Promise<ICsrfTokenData> =>
    this.axiosInstance
      .get("/auth/get-csrf-token/")
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });

  emailCheck = async (data: IEmailCheckData): Promise<IEmailCheckResponse> =>
    this.axiosInstance
      .post("/auth/mobile/email-check/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  generateUniqueCode = async (data: { email: string }): Promise<any> =>
    this.axiosInstance
      .post("/auth/mobile/magic-generate/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  currentUser = async (): Promise<IUser> =>
    this.axiosInstance
      .get("/api/users/me/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });

  signOut = async (): Promise<void> =>
    this.axiosInstance
      .post("/auth/mobile/sign-out/", {})
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
}

const mobileAuthService = new MobileAuthService();

export default mobileAuthService;
