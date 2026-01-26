import { ArrowLeft } from "lucide-react";
import { observer } from "mobx-react";
// plane imports
import { ROLE_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { IconButton } from "@plane/propel/icon-button";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  projectId: string;
};

export const ProjectSettingsSidebarHeader = observer(function ProjectSettingsSidebarHeader(props: Props) {
  const { projectId } = props;
  // router
  const router = useAppRouter();
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
    <div className="shrink-0">
      <div className="py-3 pl-4 pr-5 flex items-center gap-1 text-body-md-medium">
        <IconButton
          variant="ghost"
          size="base"
          icon={ArrowLeft}
          onClick={() => router.push(`/${currentWorkspace?.slug}/projects/${projectId}/issues/`)}
        />
        <p>Project settings</p>
      </div>
      <div className="mt-1.5 flex items-center gap-2 py-0.5 px-5 truncate">
        <div className="shrink-0 size-8 grid place-items-center bg-layer-2 rounded">
          <Logo logo={projectDetails?.logo_props} size={20} />
        </div>
        <div className="truncate">
          <p className="text-body-sm-medium truncate">{projectDetails?.name}</p>
          <p className="text-caption-md-regular truncate">{t(ROLE_DETAILS[currentProjectRole].i18n_title)}</p>
        </div>
      </div>
    </div>
  );
});
