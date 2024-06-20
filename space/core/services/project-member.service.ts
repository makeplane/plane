// types
import type { IProjectMember, IProjectMembership } from "@plane/types";
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class ProjectMemberService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchProjectMembers(anchor: string): Promise<IProjectMembership[]> {
    return this.get(`/api/anchor/${anchor}/members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectMember(anchor: string, memberID: string): Promise<IProjectMember> {
    return this.get(`/api/anchor/${anchor}/members/${memberID}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
