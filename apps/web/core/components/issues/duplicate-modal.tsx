/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { InfoIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
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

export const DuplicateWorkItemModal = observer(function DuplicateWorkItemModal(props: TDuplicateWorkItemModalProps) {
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
        <div className="space-y-3 border-b border-subtle-1 pb-2">
          <h3 className="text-14 text-primary">{t("issue.duplicate.modal.title")}</h3>
          {/* Call out */}
          <div className="flex  gap-2 rounded-md bg-layer-1 p-2">
            <InfoIcon className="size-5 text-tertiary" />
            <p className="text-tertiary text-11">
              {serviceType === EIssueServiceType.EPICS ? (
                <>
                  {t("issue.duplicate.modal.description1")}
                  <span className="font-semibold text-secondary">{t("issue.duplicate.modal.description2")}</span>
                </>
              ) : (
                <>
                  {t("issue.duplicate.modal.description1")}
                  <span className="font-semibold text-secondary">{t("issue.duplicate.modal.description2")}</span>
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
          <Button variant="secondary" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!selectedProject}>
            {t("common.done")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
