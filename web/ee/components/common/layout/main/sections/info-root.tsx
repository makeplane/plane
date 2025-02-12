"use client";

import React, { FC, useEffect, useState } from "react";
// enums
import { EFileAssetType } from "@plane/types/src/enums";
// hooks
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// local components
import { DescriptionInput, TitleInput } from "../../../input";
import { SectionWrapper } from "../common";

type TInfoSectionProps = {
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
};

export const InfoSection: FC<TInfoSectionProps> = (props) => {
  const {
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
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex-grow">
          <TitleInput
            isSubmitting={isSubmitting}
            setIsSubmitting={(value) => setIsSubmitting(value)}
            onSubmit={onTitleSubmit}
            disabled={disabled}
            value={titleValue}
            containerClassName="-ml-3"
          />
        </div>
        {indicatorElement && <>{indicatorElement}</>}
      </div>
      <DescriptionInput
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
