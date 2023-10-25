// services
import { APIService } from "services/api.service";
import { IUser, IWorkspace } from "types";

export class LicenseService extends APIService {
  constructor() {
    super("http://localhost:8080");
  }

  async getProducts(): Promise<any[]> {
    return this.get(`/api/products/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createSubscription(user: IUser, priceId: string): Promise<any> {
    return this.post(`/api/subscriptions/`, { user, priceId })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createCheckoutSession(priceId: string, seats: number, workspace: IWorkspace, user: IUser): Promise<any> {
    return this.post(`/api/checkout/create-session/`, { priceId, seats, workspace, user })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
