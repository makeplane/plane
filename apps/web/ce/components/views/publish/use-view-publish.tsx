/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Earth } from "lucide-react";
// ui
import type { TContextMenuItem } from "@plane/ui";

export const useViewPublish = (isPublished: boolean, isAuthorized: boolean) => {
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);

  const publishContextMenu: TContextMenuItem | undefined = isAuthorized
    ? {
        key: "publish",
        action: () => setPublishModalOpen(true),
        title: isPublished ? "Unpublish" : "Publish",
        icon: Earth,
      }
    : undefined;

  return {
    isPublishModalOpen,
    setPublishModalOpen,
    publishContextMenu,
  };
};
