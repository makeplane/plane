import { useEffect, useState } from "react";
import { StaffService  } from "@/plane-web/services/staff.service";
import type {IMyStaffProfile} from "@/plane-web/services/staff.service";

const staffService = new StaffService();

export const useMyStaffProfile = (workspaceSlug: string | undefined) => {
  const [data, setData] = useState<IMyStaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!workspaceSlug) return;
    setIsLoading(true);
    staffService
      .getMyStaffProfile(workspaceSlug)
      .then(setData)
      .catch(() => setData(null)) // 404 or error = hide section gracefully
      .finally(() => setIsLoading(false));
  }, [workspaceSlug]);

  return { data, isLoading };
};
