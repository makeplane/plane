/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

export type TWorkflowDisabledOverlayProps = {
  messageContainerRef: React.RefObject<HTMLDivElement>;
  workflowDisabledSource: string;
  shouldOverlayBeVisible: boolean;
};

export const WorkFlowDisabledOverlay = observer(function WorkFlowDisabledOverlay(props: TWorkflowDisabledOverlayProps) {
  const { messageContainerRef, workflowDisabledSource: _workflowDisabledSource, shouldOverlayBeVisible } = props;
  const { t } = useTranslation();

  if (!shouldOverlayBeVisible) return null;

  return (
    <div
      ref={messageContainerRef}
      className={cn(
        "pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-sm bg-danger-subtle/80 p-2"
      )}
    >
      <p className="text-center text-11 font-medium text-danger-primary">
        {t("project_settings.workflows.blocker_message")}
      </p>
    </div>
  );
});
