/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { WorkFlowDisabledMessage } from "./workflow-disabled-message";

export type TWorkflowDisabledOverlayProps = {
  messageContainerRef: React.RefObject<HTMLDivElement>;
  workflowDisabledSource: string;
  shouldOverlayBeVisible: boolean;
};

export const WorkFlowDisabledOverlay = observer(function WorkFlowDisabledOverlay(props: TWorkflowDisabledOverlayProps) {
  const { workflowDisabledSource, shouldOverlayBeVisible } = props;

  if (!shouldOverlayBeVisible) return <></>;

  return (
    <div className="my-8 flex w-full justify-center">
      <WorkFlowDisabledMessage parentStateId={workflowDisabledSource} />
    </div>
  );
});
