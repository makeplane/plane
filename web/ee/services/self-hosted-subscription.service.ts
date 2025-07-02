/* eslint-disable no-useless-catch */
import { AxiosError } from "axios";
// plane imports
import { API_BASE_URL } from "@plane/constants";
// plane web types
import { TSelfHostedSubscription } from "@/plane-web/types/self-hosted-subscription";
// services
import { APIService } from "@/services/api.service";

export class SelfHostedSubscriptionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * @description fetching the license status
   * @param { string } workspaceSlug
   * @returns { TSelfHostedSubscription | undefined }
   */
  async fetchSubscription(workspaceSlug: string): Promise<TSelfHostedSubscription | undefined> {
    try {
      const { data } = await this.get(`/api/payments/workspaces/${workspaceSlug}/licenses/`);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description fetching issue worklogs by issueId
   * @param { string } workspaceSlug
   * @param { { license_key: string } } payload
   * @returns { TSelfHostedSubscription | undefined }
   */
  async activateUsingLicenseKey(
    workspaceSlug: string,
    payload: { license_key: string }
  ): Promise<TSelfHostedSubscription | undefined> {
    try {
      const { data } = await this.post(`/api/payments/workspaces/${workspaceSlug}/licenses/`, payload);
      return data || undefined;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw error.response?.data;
      }
    }
  }

  /**
   * @description activating workspace license using license file
   * @param { string } workspaceSlug
   * @param { File } file
   * @returns { TSelfHostedSubscription | undefined }
   */
  async activateUsingLicenseFile(workspaceSlug: string, file: File): Promise<TSelfHostedSubscription | undefined> {
    try {
      const formData = new FormData();
      formData.append("license_file", file);
      const { data } = await this.post(`/api/payments/workspaces/${workspaceSlug}/licenses/upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data || undefined;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw error.response?.data;
      }
    }
  }

  /**
   * @description deactivating the workspace license
   * @param { string } workspaceSlug
   * @returns { void }
   */
  async deactivateLicense(workspaceSlug: string): Promise<void> {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/licenses/deactivate/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const selfHostedSubscriptionService = new SelfHostedSubscriptionService();

export default selfHostedSubscriptionService;
