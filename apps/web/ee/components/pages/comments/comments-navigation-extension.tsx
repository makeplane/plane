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

import { useCallback, useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import type { INavigationPaneExtensionProps } from "@/components/pages/navigation-pane/types";
import type { TCommentsNavigationExtensionData } from "@/types/pages/pane-extensions";
// local components
import { usePageStore } from "@/plane-web/hooks/store";
import { PageCommentsSidebarPanel } from "./comments-sidebar-panel";

export const PageCommentsNavigationExtension = observer(function PageCommentsNavigationExtension(
  props: INavigationPaneExtensionProps<TCommentsNavigationExtensionData>
) {
  const { page, extensionData, storeType } = props;
  const { isCommentsEnabled } = usePageStore(storeType);
  const { workspaceSlug } = useParams();

  // Extract comments-specific data from extensionData
  const {
    selectedCommentId,
    pendingComment,
    onPendingCommentCancel,
    onStartNewComment,
    onCreateCommentMark,
    onSelectedThreadConsumed,
  } = extensionData || {};

  // Store the ThreadsSidebar's registered handler
  const [registeredHandler, setRegisteredHandler] = useState<
    ((selection?: { from: number; to: number; referenceText?: string }) => void) | null
  >(null);

  // Handle registering the ThreadsSidebar's internal handler
  const handleRegisterStartNewComment = useCallback(
    (handler: (selection?: { from: number; to: number; referenceText?: string }) => void) => {
      setRegisteredHandler(() => handler);
    },
    []
  );

  // Connect external onStartNewComment to the registered internal handler
  useEffect(() => {
    if (onStartNewComment && registeredHandler) {
      // Attach the registered handler to the callback so page-root can call it
      (onStartNewComment as { registeredHandler?: typeof registeredHandler }).registeredHandler = registeredHandler;
    }
  }, [onStartNewComment, registeredHandler]);

  if (!isCommentsEnabled(workspaceSlug.toString())) return null;

  return (
    <PageCommentsSidebarPanel
      page={page}
      selectedThreadId={selectedCommentId}
      pendingComment={pendingComment}
      handlers={{
        onPendingCommentCancel: onPendingCommentCancel,
        onRegisterStartNewComment: handleRegisterStartNewComment,
        onCreateCommentMark: onCreateCommentMark,
        onSelectedThreadConsumed,
      }}
    />
  );
});
