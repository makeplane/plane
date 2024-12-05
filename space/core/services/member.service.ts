import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";
// types
import { TPublicMember } from "@/types/member";

export class MemberService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getAnchorMembers(anchor: string): Promise<TPublicMember[]> {
    return this.get(`/api/public/anchor/${anchor}/members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
