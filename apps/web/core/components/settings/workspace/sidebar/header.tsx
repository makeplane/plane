import { observer } from "mobx-react";
// plane imports
import { ROLE_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { WorkspaceLogo } from "@/components/workspace/logo";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { SubscriptionPill } from "@/plane-web/components/common/subscription/subscription-pill";

export const WorkspaceSettingsSidebarHeader = observer(function WorkspaceSettingsSidebarHeader() {
  // store hooks
  const { data: currentUser } = useUser();
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const currentWorkspaceRole = currentWorkspace?.slug
    ? getWorkspaceRoleByWorkspaceSlug(currentWorkspace.slug)
    : undefined;
  // translation
  const { t } = useTranslation();

  if (!currentWorkspaceRole) return null;

  return (
    <div className="shrink-0 px-5">
      <div className="py-3 text-body-md-medium">{t(ROLE_DETAILS[currentWorkspaceRole].i18n_title)} settings</div>
      <div className="flex items-center justify-between gap-2 py-0.5">
        <div className="flex items-center gap-2">
          <WorkspaceLogo
            logo={currentWorkspace?.logo_url}
            name={currentWorkspace?.name}
            classNames="shrink-0 size-8 border border-subtle"
          />
          <div className="truncate">
            <p className="text-body-sm-medium truncate">
              {currentUser?.first_name} {currentUser?.last_name}
            </p>
            <p className="text-caption-md-regular truncate">{currentUser?.email}</p>
          </div>
        </div>
        <div className="shrink-0">
          <SubscriptionPill />
        </div>
      </div>
    </div>
  );
});
