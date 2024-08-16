import { IPaymentProduct, IWorkspaceProductSubscription } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class PaymentService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async listProducts(workspaceSlug: string): Promise<IPaymentProduct[]> {
    return this.get(`/api/payments/workspaces/${workspaceSlug}/products/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCurrentWorkspacePaymentLink(workspaceSlug: string, data = {}) {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/payment-link/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async upgradeCurrentWorkspaceSubscription(workspaceSlug: string, data = {}) {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/subscriptions/upgrade/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspaceCurrentPlan(workspaceSlug: string): Promise<IWorkspaceProductSubscription> {
    return this.get(`/api/payments/workspaces/${workspaceSlug}/current-plan/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async refreshWorkspaceCurrentPlan(workspaceSlug: string): Promise<void> {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/license-refresh/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspaceSubscriptionPageLink(workspaceSlug: string) {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/subscriptions/`)
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

  async getFreeTrialSubscription(workspaceSlug: string, payload: { product_id: string; price_id: string }) {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/trial-subscriptions/`, payload)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
