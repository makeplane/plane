"use client";

import { useState } from "react";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import { TDeDupeIssue, TIssue } from "@plane/types";
// ui
import { Button, TOAST_TYPE, setToast, Dialog, EModalWidth } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store";
import { useIssues } from "@/hooks/store/use-issues";

type Props = {
  data?: TIssue | TDeDupeIssue;
  dataId?: string | null | undefined;
  handleClose: () => void;
  isOpen: boolean;
  onSubmit?: () => Promise<void>;
};

export const ArchiveIssueModal: React.FC<Props> = (props) => {
  const { dataId, data, isOpen, handleClose, onSubmit } = props;
  const { t } = useTranslation();
  // states
  const [isArchiving, setIsArchiving] = useState(false);
  // store hooks
  const { getProjectById } = useProject();
  const { issueMap } = useIssues();

  if (!dataId && !data) return null;

  const issue = data ? data : issueMap[dataId!];
  const projectDetails = getProjectById(issue.project_id);

  const onClose = () => {
    setIsArchiving(false);
    handleClose();
  };

  const handleArchiveIssue = async () => {
    if (!onSubmit) return;

    setIsArchiving(true);
    await onSubmit()
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("issue.archive.success.label"),
          message: t("issue.archive.success.message"),
        });
        onClose();
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error.label"),
          message: t("issue.archive.failed.message"),
        })
      )
      .finally(() => setIsArchiving(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Panel width={EModalWidth.XXL}>
        <div className="px-5 py-4">
          <h3 className="text-xl font-medium 2xl:text-2xl">
            {t("issue.archive.label")} {projectDetails?.identifier} {issue.sequence_id}
          </h3>
          <p className="mt-3 text-sm text-custom-text-200">{t("issue.archive.confirm_message")}</p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="neutral-primary" size="sm" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" tabIndex={1} onClick={handleArchiveIssue} loading={isArchiving}>
              {isArchiving ? t("common.archiving") : t("common.archive")}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};
