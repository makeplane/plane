import { API_BASE_URL } from "@plane/constants";
import type { IUserDailyWorklogTotal } from "@plane/types";
import { APIService } from "@/services/api.service";

function getData<T>(response: { data: T }): T {
  return response.data;
}

export class UserWorklogService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Returns the current user's total logged minutes for today across all workspaces.
   * Passes browser timezone so the backend computes "today" in the user's local timezone.
   */
  async getUserDailyTotal(): Promise<IUserDailyWorklogTotal> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return (
      this.get(`/api/users/me/daily-worklog-total/?tz=${encodeURIComponent(tz)}`) as Promise<{
        data: IUserDailyWorklogTotal;
      }>
    )
      .then(getData)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }
}
