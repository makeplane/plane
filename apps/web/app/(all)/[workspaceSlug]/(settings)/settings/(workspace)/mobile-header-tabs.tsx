import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { WORKSPACE_SETTINGS_LINKS, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web helpers
import { shouldRenderSettingLink } from "@/plane-web/helpers/workspace.helper";

type Props = {
  workspaceSlug: string;
};

export const MobileWorkspaceSettingsTabs = observer(({ workspaceSlug }: Props) => {
  const router = useAppRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  // mobx store
  const { allowPermissions } = useUserPermissions();

  return (
    <div className="flex-shrink-0 md:hidden sticky inset-0 flex overflow-x-auto bg-custom-background-100 z-10">
      {WORKSPACE_SETTINGS_LINKS.map(
        (item, index) =>
          shouldRenderSettingLink(workspaceSlug, item.key) &&
          allowPermissions(item.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug) && (
            <div
              className={`${
                item.highlight(pathname, `/${workspaceSlug}`)
                  ? "text-custom-primary-100 text-sm py-2 px-3 whitespace-nowrap flex flex-grow cursor-pointer justify-around border-b border-custom-primary-200"
                  : "text-custom-text-200 flex flex-grow cursor-pointer justify-around border-b border-custom-border-200 text-sm py-2 px-3 whitespace-nowrap"
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
