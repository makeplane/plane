import { IPaymentProduct, IWorkspaceProductSubscription, TMemberInviteCheck, TProrationPreview } from "@plane/types";
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

  /**
   * @description checking if the member invite is allowed
   * @param { string } workspaceSlug
   * @returns { TMemberInviteCheck }
   */
  async memberInviteCheck(workspaceSlug: string): Promise<TMemberInviteCheck> {
    return await this.get(`/api/workspaces/${workspaceSlug}/invite-check/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description updating the workspace seats
   * @param { string } workspaceSlug
   * @param { number } quantity
   * @returns { Promise<{ seats: number }> }
   */
  async updateWorkspaceSeats(workspaceSlug: string, quantity: number): Promise<{ seats: number }> {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/subscriptions/seats/`, {
      quantity,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description removing unused seats
   * @param { string } workspaceSlug
   * @returns { Promise<{ seats: number }> }
   */
  async removeUnusedSeats(workspaceSlug: string): Promise<{ seats: number }> {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/subscriptions/seats/remove-unused/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description canceling the free trial
   * @param { string } workspaceSlug
   * @returns { Promise<void> }
   */
  async cancelFreeTrial(workspaceSlug: string): Promise<void> {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/subscriptions/cancel-trial/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description fetching proration preview
   * @param { string } workspaceSlug
   * @param { number } quantity
   * @returns { Promise<TProrationPreview> }
   */
  async fetchProrationPreview(workspaceSlug: string, quantity: number): Promise<TProrationPreview> {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/subscriptions/proration-preview/`, {
      quantity,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
