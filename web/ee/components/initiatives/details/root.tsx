import { useState } from "react";
import { observer } from "mobx-react";
// hooks
import { setToast, TOAST_TYPE } from "@plane/ui";
import { ProjectMultiSelectModal } from "@/components/project";
import { useProject, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants";
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
    initiative: { getInitiativeById, updateInitiative, addEpicsToInitiative },
  } = useInitiatives();
  const { workspaceProjectIds } = useProject();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const initiative = getInitiativeById(initiativeId);
  const projectsIds = initiative?.project_ids ?? [];
  const isEditable = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  // handlers
  const handleProjectsUpdate = async (initiativeProjectIds: string[]) => {
    if (!initiativeId) return;

    await updateInitiative(workspaceSlug?.toString(), initiativeId, { project_ids: initiativeProjectIds })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Initiative projects updated successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to update initiative projects. Please try again!`,
        });
      });
  };

  const handleAddEpicToInitiative = async (epicIds: string[]) => {
    try {
      addEpicsToInitiative(workspaceSlug?.toString(), initiativeId, epicIds).then(() => {
        setToast({
          title: "Success!",
          type: TOAST_TYPE.SUCCESS,
          message: `Epic${epicIds.length > 1 ? "s" : ""} added to Initiative successfully.`,
        });
      });
    } catch {
      setToast({
        title: "Error!",
        type: TOAST_TYPE.ERROR,
        message: "Epic addition to Initiative failed. Please try again later.",
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
        searchParams={{
          initiative_id: initiativeId,
        }}
        handleClose={() => setIsEpicModalOpen(false)}
        handleOnSubmit={async (data) => {
          handleAddEpicToInitiative(data.map((epic) => epic.id));
        }}
      />
      <EpicPeekOverview />
    </LayoutRoot>
  );
});
