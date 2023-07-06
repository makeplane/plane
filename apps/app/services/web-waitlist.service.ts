// services
import APIService from "services/api.service";

// types
import { IWebWaitListResponse } from "types";

class WebWailtListServices extends APIService {
  constructor() {
    super(`${window?.location?.origin || ``}/`);
  }

  async create({ email }: { email: string }): Promise<IWebWaitListResponse> {
    return this.post(`/api/web-waitlist`, { email: email })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

export default new WebWailtListServices();
