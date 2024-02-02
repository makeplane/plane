// services
import { APIService } from "services/api.service";
// types
import type { TViewFilterProps, TUserView } from "@plane/types";
import { TUserViewService } from "../types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class WorkspaceFiltersService extends APIService implements TUserViewService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetch(workspaceSlug: string): Promise<TUserView | undefined> {
    return this.get(`/api/workspaces/${workspaceSlug}/user-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, data: Partial<TViewFilterProps>): Promise<TUserView | undefined> {
    return this.patch(`/api/workspaces/${workspaceSlug}/user-properties/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
