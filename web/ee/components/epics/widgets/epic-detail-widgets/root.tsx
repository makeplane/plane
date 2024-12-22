"use client";
import React, { FC } from "react";
// components
import { EpicDetailWidgetModals } from "./epic-detail-widget-modals";
import { EpicDetailWidgetActionButtons } from "./epic-detail-widgets-root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled: boolean;
  renderWidgetModals?: boolean;
};

export const EpicDetailWidgetsRoot: FC<Props> = (props) => {
  const { workspaceSlug, projectId, epicId, disabled, renderWidgetModals = true } = props;
  return (
    <>
      <div className="flex flex-col gap-5">
        <EpicDetailWidgetActionButtons
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={epicId}
          disabled={disabled}
        />
      </div>
      {renderWidgetModals && (
        <EpicDetailWidgetModals workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} />
      )}
    </>
  );
};
