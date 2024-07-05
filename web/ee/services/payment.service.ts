import { IPaymentProduct, IWorkspaceProductSubscription } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class PaymentService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  listProducts(workspaceSlug: string): Promise<IPaymentProduct[]> {
    return this.get(`/api/payments/workspaces/${workspaceSlug}/products/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  getCurrentWorkspacePaymentLink(workspaceSlug: string, data = {}) {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/payment-link/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  getWorkspaceCurrentPlane(workspaceSlug: string): Promise<IWorkspaceProductSubscription> {
    return this.get(`/api/payments/workspaces/${workspaceSlug}/current-plan/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPaymentLink(data = {}) {
    return this.post(`/api/payments/website/payment-link/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
