import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";

type TProps = {
  isWorkspaceAdmin: boolean;
  handleJoinProject: () => void;
  isJoinButtonDisabled: boolean;
  errorStatusCode: number | undefined;
};

export const ProjectAccessRestriction = observer(function ProjectAccessRestriction(props: TProps) {
  const { isWorkspaceAdmin, handleJoinProject, isJoinButtonDisabled, errorStatusCode } = props;
  // plane hooks
  const { t } = useTranslation();

  // Show join project screen only for workspace admins
  // Under PBAC, regular members cannot self-join projects
  if (errorStatusCode === 403 && isWorkspaceAdmin)
    return (
      <div className="grid h-full w-full place-items-center bg-surface-1">
        <EmptyStateDetailed
          title={t("project_empty_state.no_access.title")}
          description={t("project_empty_state.no_access.join_description")}
          assetKey="no-access"
          assetClassName="size-40"
          actions={[
            {
              label: isJoinButtonDisabled
                ? t("project_empty_state.no_access.cta_loading")
                : t("project_empty_state.no_access.cta_primary"),
              onClick: handleJoinProject,
              disabled: isJoinButtonDisabled,
            },
          ]}
        />
      </div>
    );

  // Show no access screen for non-admin members
  if (errorStatusCode === 403) {
    return (
      <div className="grid h-full w-full place-items-center bg-surface-1">
        <EmptyStateDetailed
          title={t("project_empty_state.no_access.title")}
          description={t("project_empty_state.no_access.restricted_description")}
          assetKey="no-access"
          assetClassName="size-40"
        />
      </div>
    );
  }

  // Show empty state screen if:
  // - Project not found (404 Not Found)
  // - Any other error status code
  return (
    <div className="grid h-full w-full place-items-center bg-surface-1">
      <EmptyStateDetailed
        title={t("project_empty_state.invalid_project.title")}
        description={t("project_empty_state.invalid_project.description")}
        assetKey="project"
        assetClassName="size-40"
      />
    </div>
  );
});
