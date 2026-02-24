import { useEffect, useState } from "react";
import { StaffService } from "@/plane-web/services/staff.service";
import type { IMyStaffProfile } from "@/plane-web/services/staff.service";

const staffService = new StaffService();

export const useMyStaffProfile = (workspaceSlug: string | undefined) => {
  const [data, setData] = useState<IMyStaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!workspaceSlug) return;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const profile = await staffService.getMyStaffProfile(workspaceSlug);
        if (!cancelled) setData(profile);
      } catch {
        // 404 or error = hide section gracefully
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [workspaceSlug]);

  return { data, isLoading };
};
