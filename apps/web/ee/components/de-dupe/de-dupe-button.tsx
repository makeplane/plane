"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// plane web imports
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
// local imports
import { WithFeatureFlagHOC } from "../feature-flags";
import { DeDupeIssueButtonLabel } from "./issue-block/button-label";

type TDeDupeButtonRoot = {
  workspaceSlug: string;
  isDuplicateModalOpen: boolean;
  handleOnClick: () => void;
  label: string;
};

export const DeDupeButtonRoot: FC<TDeDupeButtonRoot> = observer((props) => {
  const { workspaceSlug, isDuplicateModalOpen, label, handleOnClick } = props;
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  if (!isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED)) return <></>;
  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PI_DEDUPE" fallback={<></>}>
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
});
