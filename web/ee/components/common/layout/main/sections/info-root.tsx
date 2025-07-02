"use client";

import React, { FC, useEffect, useState } from "react";
// plane imports
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
import { EFileAssetType } from "@plane/types";
// hooks
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// local components
import { DescriptionInput, TitleInput } from "../../../input";
import { SectionWrapper } from "../common";

type TInfoSectionProps = {
  editorReadOnlyRef?: React.RefObject<EditorReadOnlyRefApi>;
  editorRef?: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId?: string;
  itemId: string;
  titleValue: string;
  descriptionValue?: string;
  onTitleSubmit: (value: string) => Promise<void>;
  onDescriptionSubmit: (value: string) => Promise<void>;
  indicatorElement?: React.ReactNode;
  disabled?: boolean;
  fileAssetType: EFileAssetType;
  actionElement?: React.ReactNode;
  identifierElement?: React.ReactNode;
  iconElement?: React.ReactNode;
  titleElement?: React.ReactNode;
};

export const InfoSection: FC<TInfoSectionProps> = (props) => {
  const {
    editorReadOnlyRef,
    editorRef,
    workspaceSlug,
    projectId,
    itemId,
    titleValue,
    descriptionValue,
    onTitleSubmit,
    onDescriptionSubmit,
    indicatorElement,
    disabled = false,
    fileAssetType,
    actionElement,
    identifierElement,
    iconElement,
    titleElement,
  } = props;

  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => setIsSubmitting("saved"), 2000);
    } else if (isSubmitting === "submitting") setShowAlert(true);
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  return (
    <SectionWrapper>
      <div className="flex w-full">
        <div className="flex flex-col gap-2 flex-1">
          {identifierElement && <>{identifierElement}</>}
          <div className="flex justify-between gap-2 w-full">
            <div className="flex flex-grow gap-3">
              {iconElement && <>{iconElement}</>}
              <div className="flex flex-col flex-grow gap-1">
                <TitleInput
                  isSubmitting={isSubmitting}
                  setIsSubmitting={(value) => setIsSubmitting(value)}
                  onSubmit={onTitleSubmit}
                  disabled={disabled}
                  value={titleValue}
                  containerClassName="-ml-3"
                />
                {titleElement && <>{titleElement}</>}
              </div>
            </div>
          </div>
        </div>
        {indicatorElement && <>{indicatorElement}</>}
      </div>
      <DescriptionInput
        editorReadOnlyRef={editorReadOnlyRef}
        editorRef={editorRef}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        itemId={itemId}
        initialValue={descriptionValue}
        disabled={disabled}
        onSubmit={onDescriptionSubmit}
        setIsSubmitting={(value) => setIsSubmitting(value)}
        containerClassName="-ml-3 border-none min-h-[88px]"
        fileAssetType={fileAssetType}
      />
      {actionElement && <div className="flex items-center justify-between w-full gap-2">{actionElement}</div>}
    </SectionWrapper>
  );
};
