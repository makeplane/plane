import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { WORKSPACE_SETTINGS_LINKS, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web helpers
import { shouldRenderSettingLink } from "@/plane-web/helpers/workspace.helper";

export const MobileWorkspaceSettingsTabs = observer(function MobileWorkspaceSettingsTabs() {
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  const { t } = useTranslation();
  // mobx store
  const { allowPermissions } = useUserPermissions();

  return (
    <div className="flex-shrink-0 md:hidden sticky inset-0 flex overflow-x-auto bg-surface-1 z-10">
      {WORKSPACE_SETTINGS_LINKS.map(
        (item, index) =>
          shouldRenderSettingLink(workspaceSlug.toString(), item.key) &&
          allowPermissions(item.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString()) && (
            <div
              className={`${
                item.highlight(pathname, `/${workspaceSlug}`)
                  ? "text-accent-primary text-13 py-2 px-3 whitespace-nowrap flex flex-grow cursor-pointer justify-around border-b border-accent-strong-200"
                  : "text-secondary flex flex-grow cursor-pointer justify-around border-b border-subtle text-13 py-2 px-3 whitespace-nowrap"
              }`}
              key={index}
              onClick={() => router.push(`/${workspaceSlug}${item.href}`)}
            >
              {t(item.i18n_label)}
            </div>
          )
      )}
    </div>
  );
});
