import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/ui";
import { useUserSettings } from "@/hooks/store/user";
import { useMyStaffProfile } from "@/plane-web/hooks/use-my-staff-profile";

export const StaffProfileSection = observer(() => {
  const { t } = useTranslation();
  const { data: userSettings } = useUserSettings();
  const workspaceSlug = userSettings?.workspace?.last_workspace_slug;
  const { data: staffProfile, isLoading } = useMyStaffProfile(workspaceSlug);

  if (isLoading || !staffProfile) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-14 font-medium text-color-primary">{t("staff.profile_section_title")}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
        {/* Staff ID */}
        <div className="flex flex-col gap-1">
          <h4 className="text-13 font-medium text-color-secondary">{t("staff.staff_id.label")}</h4>
          <Input
            type="text"
            value={staffProfile.staff_id || "—"}
            className="w-full cursor-not-allowed rounded-md !bg-surface-2"
            disabled
          />
        </div>
        {/* Department */}
        <div className="flex flex-col gap-1">
          <h4 className="text-13 font-medium text-color-secondary">{t("staff.department.label")}</h4>
          <Input
            type="text"
            value={staffProfile.department_detail?.name ?? "—"}
            className="w-full cursor-not-allowed rounded-md !bg-surface-2"
            disabled
          />
        </div>
        {/* Position */}
        <div className="flex flex-col gap-1">
          <h4 className="text-13 font-medium text-color-secondary">{t("staff.position.label")}</h4>
          <Input
            type="text"
            value={staffProfile.position || "—"}
            className="w-full cursor-not-allowed rounded-md !bg-surface-2"
            disabled
          />
        </div>
      </div>
    </div>
  );
});
