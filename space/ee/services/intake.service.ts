// types
import { API_BASE_URL } from "@/helpers/common.helper";
import { APIService } from "@/services/api.service";
import { TIntakeIssueForm } from "@/types/intake";
// helpers

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
