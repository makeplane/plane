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

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import type { TIssue } from "@plane/types";
import { Card, cn } from "@plane/ui";
import { IssueModalProvider } from "@/components/issues/issue-modal/context/provider";
import { WorkItemFormRoot } from "@/components/issues/issue-modal/form/root";
import type { TArtifact, TUpdatedArtifact } from "@/types";
import { useWorkItemData } from "../useArtifactData";
import { PiChatArtifactsFooter } from "./footer";

interface TWorkItemDetailProps {
  data: TArtifact;
  updateArtifact: (data: TUpdatedArtifact) => Promise<void>;
  workspaceSlug: string;
  activeChatId: string;
}

export const WorkItemDetail = observer(function WorkItemDetail(props: TWorkItemDetailProps) {
  // props
  const { data, updateArtifact, workspaceSlug, activeChatId } = props;
  // state
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // hooks
  const updatedData = useWorkItemData(data.artifact_id);
  const issueTitleRef = useRef<HTMLInputElement>(null);
  // derived values
  const projectId = data.parameters?.project?.id;

  const handleOnSave = () => {
    setIsSaving(false);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      setError(null);
    }, 1000);
  };

  const handleOnChange = async (formData: Partial<TIssue> | null) => {
    if (!formData) return;
    setIsSaving(true);
    await updateArtifact(formData)
      .then(() => {
        handleOnSave();
      })
      .catch((error) => {
        console.error(error);
        setError(error);
        handleOnSave();
      });
  };
  const commonIssueModalProps = {
    issueTitleRef: issueTitleRef,
    data: updatedData,
    onChange: handleOnChange,
    onAssetUpload: () => {},
    onClose: () => {},
    onSubmit: () => Promise.resolve(),
    projectId: projectId?.toString() || "",
    isCreateMoreToggleEnabled: false,
    onCreateMoreToggleChange: () => {},
    isDraft: false,
    moveToIssue: false,
    modalTitle: "Work item",
    isDuplicateModalOpen: false,
    handleDuplicateIssueModal: () => {},
    isProjectSelectionDisabled: false,
    convertToWorkItem: false,
    showActionButtons: false,
  };

  return (
    <>
      {projectId && (
        <div className="overflow-scroll h-full m-auto flex flex-col justify-center items-center mb-[100px]">
          <Card className="relative max-w-[700px] rounded-xl shadow-overlay-200 p-0 space-y-0 border border-subtle overflow-scroll">
            <IssueModalProvider>
              <WorkItemFormRoot {...commonIssueModalProps} key={data.artifact_id} />
            </IssueModalProvider>
            <div
              className={cn("absolute top-0 right-0 w-full h-full bg-surface-1 rounded-xl opacity-50", {
                hidden: data.is_editable,
              })}
            />
          </Card>
        </div>
      )}
      <PiChatArtifactsFooter
        artifactsData={data}
        workspaceSlug={workspaceSlug}
        activeChatId={activeChatId}
        artifactId={data.artifact_id}
        isSaving={isSaving}
        showSavedToast={showSavedToast}
        error={error}
      />
    </>
  );
});
