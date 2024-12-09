"use client";
import React, { FC } from "react";
// constants
import { E_FEATURE_FLAGS } from "@/plane-web/hooks/store";
// local components
import { WithFeatureFlagHOC } from "../feature-flags";
import { DeDupeIssueButtonLabel } from "./issue-block";

type TDeDupeButtonRoot = {
  workspaceSlug: string;
  isDuplicateModalOpen: boolean;
  handleOnClick: () => void;
  label: string;
};

export const DeDupeButtonRoot: FC<TDeDupeButtonRoot> = (props) => {
  const { workspaceSlug, isDuplicateModalOpen, label, handleOnClick } = props;
  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag={E_FEATURE_FLAGS.PI_DEDUPE} fallback={<></>}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleOnClick();
        }}
      >
        <DeDupeIssueButtonLabel isOpen={isDuplicateModalOpen} buttonLabel={label} />
      </button>
    </WithFeatureFlagHOC>
  );
};
