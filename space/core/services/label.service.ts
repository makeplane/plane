import { API_BASE_URL } from "@plane/constants";
import { IIssueLabel } from "@plane/types";
// services
import { APIService } from "./api.service";

export class LabelService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getLabels(anchor: string): Promise<IIssueLabel[]> {
    return this.get(`/api/public/anchor/${anchor}/labels/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
