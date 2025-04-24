import { API_BASE_URL } from "@plane/constants";
import { TIssuePropertyValues } from "@plane/types";
// services
import { APIService } from "../api.service";

export class CustomerPropertyValueService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, customerId: string): Promise<TIssuePropertyValues> {
    return this.get(`/api/workspaces/${workspaceSlug}/customers/${customerId}/values/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, customerId: string, data: TIssuePropertyValues): Promise<TIssuePropertyValues> {
    return this.post(`/api/workspaces/${workspaceSlug}/customers/${customerId}/values/`, {
      customer_property_values: data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, customerId: string, propertyId: string, data: string[]): Promise<void> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/customers/${customerId}/customer-properties/${propertyId}/values/`,
      {
        values: data,
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
