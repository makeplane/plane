import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles, EIssueLayoutTypes } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { ProjectMultiSelectModal } from "@/components/project";
import { useProject, useUserPermissions } from "@/hooks/store";
import { WorkspaceEpicsListModal } from "@/plane-web/components/initiatives/details/main/collapsible-section/epics/workspace-epic-modal";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { EpicPeekOverview } from "../../epics";
import { InitiativeScopeGanttView } from "./gantt/root";
import { InitiativeScopeListView } from "./list/root";

export const InitiativeScopeRoot = observer(() => {
  const { initiativeId, workspaceSlug } = useParams();

  const { t } = useTranslation();

  // states
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);

  const {
    initiative: {
      scope: { getDisplayFilters },
      epics: { getInitiativeEpicsById, addEpicsToInitiative },
      getInitiativeById,
      fetchInitiativeAnalytics,
      updateInitiative,
    },
  } = useInitiatives();
  const { allowPermissions } = useUserPermissions();
  const { workspaceProjectIds } = useProject();

  // derived values
  const initiative = getInitiativeById(initiativeId?.toString());
  const initiativeEpics = getInitiativeEpicsById(initiativeId?.toString());
  const isEditable = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const displayFilters = getDisplayFilters(initiativeId?.toString());
  const activeLayout = displayFilters?.activeLayout as EIssueLayoutTypes.LIST | EIssueLayoutTypes.GANTT;

  // Common props for scope views
  const scopeViewProps = useMemo(
    () => ({
      epicIds: initiativeEpics ?? [],
      projectIds: initiative?.project_ids ?? [],
      workspaceSlug: workspaceSlug?.toString(),
      initiativeId: initiativeId?.toString(),
      disabled: !isEditable,
      handleAddEpic: () => setIsEpicModalOpen(true),
      handleAddProject: () => setIsProjectsOpen(true),
    }),
    [initiativeEpics, initiative, workspaceSlug, initiativeId, isEditable]
  );

  // Layout components mapping
  const INITIATIVE_SCOPE_ACTIVE_LAYOUTS = useMemo(
    () => ({
      [EIssueLayoutTypes.LIST]: <InitiativeScopeListView {...scopeViewProps} />,
      [EIssueLayoutTypes.GANTT]: <InitiativeScopeGanttView {...scopeViewProps} />,
    }),
    [scopeViewProps]
  );

  const handleAddEpicToInitiative = async (epicIds: string[]) => {
    try {
      await addEpicsToInitiative(workspaceSlug?.toString(), initiativeId?.toString(), epicIds);
      fetchInitiativeAnalytics(workspaceSlug?.toString(), initiativeId?.toString());
      setToast({
        title: t("toast.success"),
        type: TOAST_TYPE.SUCCESS,
        message: t("initiatives.toast.epic_update_success", { count: epicIds.length }),
      });
    } catch {
      setToast({
        title: t("toast.success"),
        type: TOAST_TYPE.ERROR,
        message: t("initiatives.toast.epic_update_error"),
      });
    }
  };

  const handleProjectsUpdate = async (initiativeProjectIds: string[]) => {
    if (!initiativeId) return;

    await updateInitiative(workspaceSlug?.toString(), initiativeId?.toString(), { project_ids: initiativeProjectIds })
      .then(async () => {
        fetchInitiativeAnalytics(workspaceSlug?.toString(), initiativeId?.toString());
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

  if (!activeLayout) return <></>;

  return (
    <>
      {INITIATIVE_SCOPE_ACTIVE_LAYOUTS[activeLayout]}
      <EpicPeekOverview />

      {/* Quick add modals */}
      <ProjectMultiSelectModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        onSubmit={handleProjectsUpdate}
        selectedProjectIds={initiative?.project_ids ?? []}
        projectIds={workspaceProjectIds ?? []}
      />
      <WorkspaceEpicsListModal
        workspaceSlug={workspaceSlug?.toString()}
        isOpen={isEpicModalOpen}
        searchParams={{}}
        selectedEpicIds={initiativeEpics ?? []}
        handleClose={() => setIsEpicModalOpen(false)}
        handleOnSubmit={async (data) => {
          handleAddEpicToInitiative(data.map((epic) => epic.id));
        }}
      />
    </>
  );
});
