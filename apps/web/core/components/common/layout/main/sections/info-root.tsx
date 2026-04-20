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

import React, { useEffect, useState } from "react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { EFileAssetType } from "@plane/types";
// components
import { DescriptionInput } from "@/components/editor/rich-text/description-input";
// hooks
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// local imports
import { SectionWrapper } from "../common/section-wrapper";
import { TitleInput } from "@/components/common/input/title-input";

type TInfoSectionProps = {
  editorRef?: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId?: string;
  itemId: string;
  titleValue: string;
  descriptionValue?: string;
  onTitleSubmit: (value: string) => Promise<void>;
  onDescriptionSubmit: (value: string, isMigrationUpdate?: boolean) => Promise<void>;
  indicatorElement?: React.ReactNode;
  fileAssetType: EFileAssetType;
  actionElement?: React.ReactNode;
  identifierElement?: React.ReactNode;
  iconElement?: React.ReactNode;
  titleElement?: React.ReactNode;
  issueSequenceId?: number;
  permissions: {
    canEditDescription: boolean;
    canEditTitle: boolean;
  };
};

export function InfoSection(props: TInfoSectionProps) {
  const {
    editorRef,
    workspaceSlug,
    projectId,
    itemId,
    titleValue,
    descriptionValue,
    onTitleSubmit,
    onDescriptionSubmit,
    indicatorElement,
    fileAssetType,
    actionElement,
    identifierElement,
    iconElement,
    titleElement,
    issueSequenceId,
    permissions,
  } = props;

  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(() => setIsSubmitting("saved"), 2000);
    } else if (isSubmitting === "submitting") setShowAlert(true);
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  return (
    <SectionWrapper className="border-0">
      <div className="flex w-full">
        <div className="flex flex-col gap-6 flex-1">
          {identifierElement && <>{identifierElement}</>}
          {iconElement && <>{iconElement}</>}
        </div>
        {indicatorElement && <>{indicatorElement}</>}
      </div>
      <div className="flex flex-col">
        <div className="flex justify-between gap-2 w-full">
          <div className="flex grow gap-3">
            <div className="flex flex-col grow gap-1">
              <TitleInput
                isSubmitting={isSubmitting}
                setIsSubmitting={(value) => setIsSubmitting(value)}
                onSubmit={onTitleSubmit}
                disabled={!permissions.canEditTitle}
                value={titleValue}
                containerClassName="-ml-3"
              />
              {titleElement && <>{titleElement}</>}
            </div>
          </div>
        </div>
        <DescriptionInput
          issueSequenceId={issueSequenceId}
          containerClassName="-ml-3 border-none min-h-[88px] text-14 text-secondary placeholder:text-placeholder"
          disabled={!permissions.canEditDescription}
          editorRef={editorRef}
          entityId={itemId}
          fileAssetType={fileAssetType}
          key={itemId}
          initialValue={descriptionValue}
          onSubmit={(value, isMigrationUpdate) => onDescriptionSubmit(value.description_html, isMigrationUpdate)}
          projectId={projectId}
          setIsSubmitting={(value) => setIsSubmitting(value)}
          workspaceSlug={workspaceSlug}
        />
      </div>
      {actionElement && <div className="flex items-center justify-between w-full gap-2">{actionElement}</div>}
    </SectionWrapper>
  );
}
