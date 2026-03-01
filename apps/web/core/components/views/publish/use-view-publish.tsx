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

import { useState } from "react";
import { useParams } from "next/navigation";
import { Share2 } from "lucide-react";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";

export const useViewPublish = (isPublished: boolean, isAuthorized: boolean) => {
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  const isViewsPublishEnabled = useFlag(workspaceSlug?.toString(), "VIEW_PUBLISH");

  const publishContextMenu = {
    key: "publish",
    action: () => setPublishModalOpen(true),
    title: isPublished ? "Publish Settings" : "Publish",
    icon: Share2,
  };

  const upgradeContextMenu = {
    key: "publish",
    action: () => togglePaidPlanModal(true),
    title: "Upgrade to publish",
    icon: Share2,
  };

  if (isViewsPublishEnabled)
    return {
      isPublishModalOpen,
      setPublishModalOpen,
      publishContextMenu: isAuthorized ? publishContextMenu : undefined,
    };

  return {
    isPublishModalOpen: false,
    setPublishModalOpen: togglePaidPlanModal,
    publishContextMenu: isAuthorized ? upgradeContextMenu : undefined,
  };
};
