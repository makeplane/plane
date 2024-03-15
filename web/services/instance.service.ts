// helpers
import { API_BASE_URL } from "helpers/common.helper";
// services
import { APIService } from "services/api.service";
// types
import type { IInstanceNotSetup, IInstance } from "@plane/types";

export class InstanceService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async requestCSRFToken(): Promise<{ csrf_token: string }> {
    return this.get("/auth/get-csrf-token/")
      .then((response) => {
        this.setCSRFToken(response.data.csrf_token);
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  }

  async getInstanceInfo(): Promise<IInstance | IInstanceNotSetup> {
    return this.get("/api/instances/")
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async createInstanceAdmin(data: FormData): Promise<void> {
    return this.post("/api/instances/admins/sign-in/", {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-CSRFToken": this.getCSRFToken(),
      },
      data,
    })
      .then((response) => {
        console.log("response.data", response.data);
        response.data;
      })
      .catch((error) => {
        throw error;
      });
  }
}
