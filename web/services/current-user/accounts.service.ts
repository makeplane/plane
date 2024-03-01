// services
import { APIService } from "services/api.service";
// types
import type { TCurrentUserAccount } from "@plane/types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class CurrentUserAccountsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetch(): Promise<TCurrentUserAccount[]> {
    return this.get(`/api/users/me/accounts/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async update(accountId: string, accountData: Partial<TCurrentUserAccount>): Promise<TCurrentUserAccount> {
    return this.patch(`/api/users/me/accounts/${accountId}/`, accountData)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
