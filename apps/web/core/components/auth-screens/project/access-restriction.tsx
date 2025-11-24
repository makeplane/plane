import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
// local imports
import { JoinProject } from "./join-project";

type TProps = {
  isWorkspaceAdmin: boolean;
  projectId: string;
  handleCreateProject: () => void;
  canAddProject: boolean;
  errorStatusCode: number | undefined;
};

export const ProjectAccessRestriction = observer(function ProjectAccessRestriction(props: TProps) {
  const { isWorkspaceAdmin, projectId, handleCreateProject, canAddProject, errorStatusCode } = props;
  // plane hooks
  const { t } = useTranslation();

  // Show join project screen if:
  // - User lacks project membership (409 Conflict)
  // - User lacks permission to access the private project (403 Forbidden) but is a workspace admin (can join any project)
  if (errorStatusCode === 409 || (errorStatusCode === 403 && isWorkspaceAdmin))
    return <JoinProject projectId={projectId} />;

  // Show empty state screen if:
  // - Project not found (404 Not Found)
  // - User lacks permission to access the private project (403 Forbidden)
  // - Any other error status code
  return (
    <div className="grid h-full w-full place-items-center bg-custom-background-100">
      <EmptyStateDetailed
        title={t("workspace_projects.empty_state.general.title")}
        description={t("workspace_projects.empty_state.general.description")}
        assetKey="project"
        assetClassName="size-40"
        actions={[
          {
            label: t("workspace_projects.empty_state.general.primary_button.text"),
            onClick: handleCreateProject,
            disabled: !canAddProject,
            variant: "primary",
          },
        ]}
      />
    </div>
  );
});
