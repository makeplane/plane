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

import { observer } from "mobx-react";
// plane web imports
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import { DeDupeIssueButtonLabel } from "./issue-block/button-label";
import { WithAiFeatureFlagHOC } from "../feature-flags/with-ai-feature-flag-hoc";

type TDeDupeButtonRoot = {
  workspaceSlug: string;
  isDuplicateModalOpen: boolean;
  handleOnClick: () => void;
  label: string;
};

export const DeDupeButtonRoot = observer(function DeDupeButtonRoot(props: TDeDupeButtonRoot) {
  const { workspaceSlug, isDuplicateModalOpen, label, handleOnClick } = props;
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  if (!isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_PI_ENABLED)) return <></>;
  return (
    <WithAiFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="AI_DEDUPE">
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleOnClick();
        }}
      >
        <DeDupeIssueButtonLabel isOpen={isDuplicateModalOpen} buttonLabel={label} />
      </button>
    </WithAiFeatureFlagHOC>
  );
});
