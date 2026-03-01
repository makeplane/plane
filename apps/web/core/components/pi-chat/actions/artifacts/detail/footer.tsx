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
import { NewTabIcon, InfoIcon } from "@plane/propel/icons";
import { getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { EDITABLE_ARTIFACT_TYPES } from "@/types";
import type { TArtifact, TUpdatedArtifact } from "@/types";
import { FollowUpDetail } from "./follow-up";
import { Toast } from "./toast";

type TProps = {
  artifactsData: TArtifact;
  workspaceSlug: string;
  activeChatId: string;
  artifactId: string;
  isSaving?: boolean;
  showSavedToast?: boolean;
  error?: string | null;
  onSubmit?: (artifactData: TUpdatedArtifact) => void;
};
export const PiChatArtifactsFooter = observer(function PiChatArtifactsFooter(props: TProps) {
  const { artifactsData, workspaceSlug, activeChatId, artifactId, isSaving, showSavedToast, error, onSubmit } = props;
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug?.toString() || "")?.id ?? "";
  const projectId = artifactsData?.parameters?.project?.id;
  return (
    <div className="fixed bottom-0 left-1/2 right-1/2 -translate-x-1/2 w-full z-20">
      {artifactsData.is_executed ? (
        <div className="flex justify-center bg-layer-2 w-full border-t border-subtle shadow-2xl">
          {artifactsData.success ? (
            <div className="flex w-full md:w-[700px] justify-between items-center p-4">
              <div className="flex flex-col items-start gap-2">
                <div className="text-body-sm-medium text-primary">
                  This {artifactsData.artifact_type} has already been {artifactsData.action}d
                </div>
                <div className="text-body-sm-regular text-secondary">You are viewing the preview version</div>
              </div>
              {artifactsData.entity_url && (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 text-body-sm-medium text-primary",
                    getButtonStyling("primary", "base")
                  )}
                  href={artifactsData.entity_url}
                >
                  <NewTabIcon className="size-3 flex-shrink-0" />
                  <div>Open {artifactsData.artifact_type}</div>
                </a>
              )}
            </div>
          ) : (
            <div className="flex justify-center bg-surface-1 w-full shadow-2xl p-4 gap-2">
              <span className="text-body-sm-medium text-primary">Action could not be executed. Please try again.</span>
            </div>
          )}
        </div>
      ) : EDITABLE_ARTIFACT_TYPES.includes(artifactsData.artifact_type) && artifactsData.is_editable ? (
        <div className="my-6 mx-auto flex flex-col gap-4 items-center justify-center">
          <div
            className={cn(
              "opacity-0 rounded-xl shadow-overlay-100 border-[0.5px] border-subtle-1 text-body-sm-regular py-2 px-3 text-secondary transition-opacity duration-300 ease-in-out",
              { "opacity-100": isSaving || showSavedToast }
            )}
          >
            {(isSaving || showSavedToast) && <Toast error={error ?? null} isSaving={isSaving ?? false} />}
          </div>
          {workspaceId && workspaceSlug && (
            <FollowUpDetail
              projectId={projectId}
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug?.toString()}
              activeChatId={activeChatId}
              artifactId={artifactId}
              messageId={artifactsData.message_id}
              artifactType={artifactsData.artifact_type}
              onSubmit={onSubmit}
            />
          )}
        </div>
      ) : (
        EDITABLE_ARTIFACT_TYPES.includes(artifactsData.artifact_type) && (
          <div className="flex justify-center bg-layer-2 w-full shadow-2xl p-4 gap-2 border border-subtle">
            <InfoIcon className="size-4 my-auto" />
            <div className="text-body-sm-medium text-primary">This artifact is no longer editable.</div>
          </div>
        )
      )}
    </div>
  );
});
