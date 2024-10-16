import axios, { AxiosInstance } from "axios";
import { IUser } from "@plane/types";
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

  async currentUser(): Promise<IUser> {
    return this.axiosInstance
      .get("/api/users/me/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async signOut(): Promise<void> {
    return this.axiosInstance
      .post("/auth/mobile/sign-out/", {})
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }
}

const mobileAuthService = new MobileAuthService();

export default mobileAuthService;
