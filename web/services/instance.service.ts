import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";
import Cookies from "js-cookie";

export class InstanceService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async checkForInstanceStatus() {
    return this.get("/api/licenses/instances/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createInstance(values: any) {
    return this.post("/api/licenses/instances/", values)
      .then((response) => {
        console.log(response);
        Cookies.set("instance_id", response?.data?.instance_id);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
