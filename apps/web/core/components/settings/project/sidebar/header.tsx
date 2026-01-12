import { observer } from "mobx-react";
// plane imports
import { ROLE_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { SubscriptionPill } from "@/plane-web/components/common/subscription/subscription-pill";
import { useProject } from "@/hooks/store/use-project";
import { Logo } from "@plane/propel/emoji-icon-picker";

type Props = {
  projectId: string;
};

export const ProjectSettingsSidebarHeader = observer(function ProjectSettingsSidebarHeader(props: Props) {
  const { projectId } = props;
  // store hooks
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { getPartialProjectById } = useProject();
  // derived values
  const projectDetails = getPartialProjectById(projectId);
  const currentProjectRole = currentWorkspace?.slug
    ? getProjectRoleByWorkspaceSlugAndProjectId(currentWorkspace.slug, projectId)
    : undefined;
  // translation
  const { t } = useTranslation();

  if (!currentProjectRole) return null;

  return (
    <div className="shrink-0 px-5">
      <div className="py-3 text-body-md-medium">{t(ROLE_DETAILS[currentProjectRole].i18n_title)} settings</div>
      <div className="flex items-center justify-between gap-2 py-0.5">
        <div className="flex items-center gap-2 truncate">
          <div className="shrink-0 size-9 grid place-items-center bg-layer-2 rounded">
            <Logo logo={projectDetails?.logo_props} size={20} />
          </div>
          <div className="truncate">
            <p className="text-body-sm-medium truncate">{projectDetails?.name}</p>
            <p className="text-caption-md-regular truncate">{t(ROLE_DETAILS[currentProjectRole].i18n_title)}</p>
          </div>
        </div>
        <div className="shrink-0">
          <SubscriptionPill />
        </div>
      </div>
    </div>
  );
});
