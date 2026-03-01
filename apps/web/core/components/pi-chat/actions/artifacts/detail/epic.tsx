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

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import type { TIssue } from "@plane/types";
import { Card } from "@plane/ui";
import { IssueModalProvider } from "@/components/issues/issue-modal/context/provider";
import { EpicFormRoot } from "@/components/epics/epic-modal/form";
import type { TArtifact, TUpdatedArtifact } from "@/types";
import { useWorkItemData } from "../useArtifactData";
import { PiChatArtifactsFooter } from "./footer";

interface TEpicDetailProps {
  workspaceSlug: string;
  activeChatId: string;
  data: TArtifact;
  updateArtifact: (data: TUpdatedArtifact) => Promise<void>;
}

export const EpicDetail = observer(function EpicDetail(props: TEpicDetailProps) {
  const { data, workspaceSlug, activeChatId, updateArtifact } = props;
  // state
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ref
  const issueTitleRef = useRef<HTMLInputElement>(null);
  // hooks
  const updatedData = useWorkItemData(data.artifact_id);
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
    modalTitle: "Epic modal",
    isDuplicateModalOpen: false,
    handleDuplicateIssueModal: () => {},
    isProjectSelectionDisabled: false,
    convertToWorkItem: false,
    showActionButtons: false,
  };
  return (
    <>
      {projectId && (
        <div className="w-full overflow-scroll h-full m-auto flex flex-col justify-center items-center mb-[100px]">
          <Card className="relative max-w-[700px] rounded-xl shadow-overlay-200 p-0 space-y-0 border border-subtle overflow-scroll">
            <IssueModalProvider>
              <EpicFormRoot {...commonIssueModalProps} key={data.artifact_id} />
            </IssueModalProvider>
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
