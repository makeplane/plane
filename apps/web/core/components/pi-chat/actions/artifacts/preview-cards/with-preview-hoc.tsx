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

import type { ReactNode } from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { EditIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EDITABLE_ARTIFACT_TYPES } from "@/types";

interface IPreviewHOC {
  children: ReactNode;
  artifactId: string;
  shouldToggleSidebar?: boolean;
  showEdited?: boolean;
  isEditable: boolean;
}

const BaseWithPreviewHOC = observer(function BaseWithPreviewHOC(props: IPreviewHOC) {
  const { children, artifactId, shouldToggleSidebar = true, showEdited = true, isEditable } = props;
  // router
  const pathname = usePathname();
  // store hooks
  const {
    togglePiArtifactsDrawer,
    isPiArtifactsDrawerOpen: artifactIdInUse,
    artifactsStore: { getArtifactByVersion, getArtifact },
  } = usePiChat();
  const { toggleSidebar } = useAppTheme();
  // derived
  const updatedArtifact = getArtifactByVersion(artifactId, "updated");
  const originalArtifact = getArtifact(artifactId);
  const isFullScreen = pathname.split("/").includes("ai-chat");
  return (
    <button
      className={cn(
        "relative group w-full flex flex-col gap-2 p-3 rounded-xl bg-surface-1 border border-subtle-1 overflow-hidden hover:shadow-sm animate-fade-in transition-all duration-300",
        {
          "border-accent-strong": artifactId === artifactIdInUse,
        }
      )}
      disabled={!shouldToggleSidebar || !isFullScreen}
      onClick={() => {
        togglePiArtifactsDrawer(artifactId ?? "");
        toggleSidebar(true);
      }}
    >
      {children}
      {showEdited &&
        isEditable &&
        isFullScreen &&
        originalArtifact?.is_editable &&
        EDITABLE_ARTIFACT_TYPES.includes(originalArtifact.artifact_type) && (
          <div
            className={cn(
              "absolute right-3 top-3 text-tertiary flex items-center gap-1 bg-surface-1 ",
              "opacity-0 group-hover:opacity-100 transition-all duration-300"
            )}
          >
            <EditIcon className="size-3" />
            <div className="text-caption-sm-regular">{!isEmpty(updatedArtifact) ? "Edited" : "Edit"}</div>
          </div>
        )}
    </button>
  );
});

function PreviewProperties(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <div
      className={cn(
        "mt-2 flex flex-wrap gap-2 items-center [&>*]:p-0 [&>*]:hover:bg-transparent text-sm text-tertiary",
        "[&>*:not(:last-child)]:after:content-['']",
        "[&>*:not(:last-child)]:after:inline-block",
        "[&>*:not(:last-child)]:after:w-1 [&>*:not(:last-child)]:after:h-1",
        "[&>*:not(:last-child)]:after:bg-layer-1",
        "[&>*:not(:last-child)]:after:rounded-full",
        "[&>*:not(:last-child)]:after:mx-1",
        "[&>*:not(:last-child)]:after:align-middle",
        "[&>*:not(:last-child)]:after:flex-shrink-0"
      )}
    >
      {children}
    </div>
  );
}

// 👇 Extend type manually here
interface WithPreviewHOCType extends React.FC<IPreviewHOC> {
  PreviewProperties: typeof PreviewProperties;
}

const WithPreviewHOC = BaseWithPreviewHOC as WithPreviewHOCType;
WithPreviewHOC.PreviewProperties = PreviewProperties;

export { WithPreviewHOC };
