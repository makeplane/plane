import { useState } from "react";
import { observer } from "mobx-react";
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// hooks
import { setToast, TOAST_TYPE } from "@plane/ui";
import { ProjectMultiSelectModal } from "@/components/project";
import { useProject, useUserPermissions } from "@/hooks/store";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { LayoutRoot } from "../../common";
import { EpicPeekOverview } from "../../epics";
import { InitiativeEmptyState } from "../details/empty-state";
import { WorkspaceEpicsListModal } from "./main/collapsible-section/epics/workspace-epic-modal";
import { InitiativeMainContentRoot } from "./main/root";
import { InitiativeSidebarRoot } from "./sidebar/root";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
};

export const InitiativeDetailRoot = observer((props: Props) => {
  const { workspaceSlug, initiativeId } = props;

  // states
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);
  // store hooks
  const {
    initiative: {
      getInitiativeById,
      updateInitiative,
      fetchInitiativeAnalytics,
      epics: { addEpicsToInitiative, getInitiativeEpicsById },
    },
  } = useInitiatives();
  const { workspaceProjectIds } = useProject();
  const { allowPermissions } = useUserPermissions();

  const { t } = useTranslation();

  // derived values
  const initiative = getInitiativeById(initiativeId);
  const projectsIds = initiative?.project_ids ?? [];
  const isEditable = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  // handlers
  const handleProjectsUpdate = async (initiativeProjectIds: string[]) => {
    if (!initiativeId) return;

    await updateInitiative(workspaceSlug?.toString(), initiativeId, { project_ids: initiativeProjectIds })
      .then(async () => {
        fetchInitiativeAnalytics(workspaceSlug, initiativeId);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: t("initiatives.toast.project_update_success"),
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.success"),
          message: error?.error ?? t("initiatives.toast.project_update_error"),
        });
      });
  };

  const handleAddEpicToInitiative = async (epicIds: string[]) => {
    try {
      addEpicsToInitiative(workspaceSlug?.toString(), initiativeId, epicIds).then(async () => {
        fetchInitiativeAnalytics(workspaceSlug, initiativeId);
        setToast({
          title: t("toast.success"),
          type: TOAST_TYPE.SUCCESS,
          message: t("initiatives.toast.epic_update_success", { count: epicIds.length }),
        });
      });
    } catch {
      setToast({
        title: t("toast.success"),
        type: TOAST_TYPE.ERROR,
        message: t("initiatives.toast.epic_update_error"),
      });
    }
  };

  const toggleEpicModal = (value?: boolean) => setIsEpicModalOpen(value || !isEpicModalOpen);
  const toggleProjectsModal = (value?: boolean) => setIsProjectsOpen(value || !isProjectsOpen);

  return (
    <LayoutRoot
      renderEmptyState={!initiative}
      emptyStateComponent={<InitiativeEmptyState workspaceSlug={workspaceSlug} />}
    >
      <InitiativeMainContentRoot
        workspaceSlug={workspaceSlug}
        initiativeId={initiativeId}
        disabled={!isEditable}
        toggleEpicModal={toggleEpicModal}
        toggleProjectModal={toggleProjectsModal}
      />
      <InitiativeSidebarRoot
        workspaceSlug={workspaceSlug}
        initiativeId={initiativeId}
        disabled={!isEditable}
        toggleEpicModal={toggleEpicModal}
        toggleProjectModal={toggleProjectsModal}
      />
      <ProjectMultiSelectModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        onSubmit={handleProjectsUpdate}
        selectedProjectIds={projectsIds ?? []}
        projectIds={workspaceProjectIds || []}
      />
      <WorkspaceEpicsListModal
        workspaceSlug={workspaceSlug}
        isOpen={isEpicModalOpen}
        searchParams={{}}
        selectedEpicIds={getInitiativeEpicsById(initiativeId) ?? []}
        handleClose={() => setIsEpicModalOpen(false)}
        handleOnSubmit={async (data) => {
          handleAddEpicToInitiative(data.map((epic) => epic.id));
        }}
      />
      <EpicPeekOverview />
    </LayoutRoot>
  );
});
