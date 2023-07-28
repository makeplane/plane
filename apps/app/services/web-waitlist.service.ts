// services
import APIService from "services/api.service";

// types
import { IWebWaitListResponse } from "types";

class WebWaitListServices extends APIService {
  constructor() {
    const origin = typeof window !== "undefined" ? window.location.origin || "" : "";
    super(origin);
  }

  async create({ email }: { email: string }): Promise<IWebWaitListResponse> {
    return this.post(`/api/web-waitlist`, { email: email })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

const webWaitListService = new WebWaitListServices();

export default webWaitListService;
