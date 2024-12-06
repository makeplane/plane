import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";
// types
import { TIntakeIssueForm } from "@/types/intake";

export class IntakeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async publishForm(anchor: string, data: Partial<TIntakeIssueForm>): Promise<TIntakeIssueForm> {
    return this.post(`/api/public/anchor/${anchor}/intake/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
