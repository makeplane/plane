import { useState } from "react";
import { observer } from "mobx-react";
import { PlusIcon, BriefcaseIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EpicIcon } from "@plane/propel/icons";
import { Button,CustomMenu,setToast,TOAST_TYPE } from "@plane/ui";
// components
import { ProjectMultiSelectModal } from "@/components/project/multi-select-modal";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local imports
import { WorkspaceEpicsListModal } from "../details/main/collapsible-section/epics/workspace-epic-modal";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
};

export const AddScopeButton = observer((props: Props) => {
  const { customButton, disabled, workspaceSlug, initiativeId } = props;

  // states
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);

  // store hooks
  const { t } = useTranslation();
  const {
    initiative: {
      epics: { addEpicsToInitiative, getInitiativeEpicsById },
      fetchInitiativeAnalytics,
      updateInitiative,
      getInitiativeById,
    },
  } = useInitiatives();
  const { workspaceProjectIds } = useProject();

  // derived values
  const initiative = getInitiativeById(initiativeId?.toString());
  const initiativeEpics = getInitiativeEpicsById(initiativeId?.toString());

  // handlers
  const handleAddEpicToInitiative = async (epicIds: string[]) => {
    try {
      addEpicsToInitiative(workspaceSlug?.toString(), initiativeId?.toString(), epicIds).then(async () => {
        fetchInitiativeAnalytics(workspaceSlug?.toString(), initiativeId?.toString());
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

  // options
  const optionItems = [
    {
      i18n_label: "common.epics",
      icon: <EpicIcon className="h-3 w-3" />,
      onClick: () => setIsEpicModalOpen(true),
    },
    {
      i18n_label: "common.projects",
      icon: <BriefcaseIcon className="h-3 w-3" />,
      onClick: () => setIsProjectsOpen(true),
    },
  ];

  const customButtonElement = customButton ? (
    <>{customButton}</>
  ) : (
    <Button variant="neutral-primary" size="sm">
      <PlusIcon className="size-4" />
      {t("initiatives.scope.add_scope")}
    </Button>
  );

  return (
    <>
      <CustomMenu customButton={customButtonElement} placement="bottom-start" disabled={disabled} closeOnSelect>
        {optionItems.map((item, index) => (
          <CustomMenu.MenuItem
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              item.onClick();
            }}
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span>{t(item.i18n_label)}</span>
            </div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
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
