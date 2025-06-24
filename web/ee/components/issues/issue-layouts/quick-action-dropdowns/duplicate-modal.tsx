import { FC, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Info } from "lucide-react";
import { EIssueServiceType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssueServiceType } from "@plane/types";
import { Button, EModalPosition, EModalWidth, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
import { CreateIssueToastActionItems } from "@/components/issues/create-issue-toast-action-items";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { ProjectDropdown } from "./project-dropdown";

type TDuplicateWorkItemModalProps = {
  workItemId: string;
  onClose: () => void;
  isOpen: boolean;
  workspaceSlug: string;
  projectId: string;
  serviceType?: TIssueServiceType;
};

export const DuplicateWorkItemModal: FC<TDuplicateWorkItemModalProps> = observer((props) => {
  const { workItemId, onClose, isOpen, workspaceSlug, projectId, serviceType = EIssueServiceType.ISSUES } = props;

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  // hooks
  const { t } = useTranslation();
  const { duplicateWorkItem } = useIssueDetail(serviceType);

  const isEpic = useMemo(() => serviceType === EIssueServiceType.EPICS, [serviceType]);

  // handlers
  const handleSubmit = async () => {
    if (!selectedProject) return;
    duplicateWorkItem(workspaceSlug, workItemId, selectedProject)
      .then((response) => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success"),
          message: isEpic ? t("epics.toast.duplicate.success.message") : t("issue.toast.duplicate.success.message"),
          actionItems: response?.project_id && (
            <CreateIssueToastActionItems
              workspaceSlug={workspaceSlug.toString()}
              projectId={response?.project_id}
              issueId={response.id}
              isEpic={isEpic}
            />
          ),
        });
      })
      .catch((error) => {
        const errorMessage =
          error?.response?.data?.error ||
          (isEpic ? t("epics.toast.duplicate.error.message") : t("issue.toast.duplicate.error.message"));
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.errors.default.title"),
          message: errorMessage,
        });
      });
  };

  const handleClose = () => {
    setSelectedProject(null);
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.MD} position={EModalPosition.TOP}>
      <div className="p-3">
        <div className="space-y-3 border-b border-custom-border-200 pb-2">
          <h3 className="text-base text-custom-text-100">{t("issue.duplicate.modal.title")}</h3>
          {/* Call out */}
          <div className="flex  gap-2 rounded-md bg-custom-background-80 p-2">
            <Info className="size-5 text-custom-text-300" />
            <p className="text-custom-text-300 text-xs">
              {serviceType === EIssueServiceType.EPICS ? (
                <>
                  {t("issue.duplicate.modal.description1")}
                  <span className="font-semibold text-custom-text-200">{t("issue.duplicate.modal.description2")}</span>
                </>
              ) : (
                <>
                  {t("issue.duplicate.modal.description1")}
                  <span className="font-semibold text-custom-text-200">{t("issue.duplicate.modal.description2")}</span>
                </>
              )}
            </p>
          </div>
          <ProjectDropdown
            value={selectedProject}
            onChange={(id: string) => setSelectedProject(id)}
            currentProjectId={projectId}
            isEpic={serviceType === EIssueServiceType.EPICS}
          />
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <Button variant="neutral-primary" onClick={handleClose} size="sm">
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} size="sm" disabled={!selectedProject}>
            {t("common.done")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
