/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CopyPlus } from "lucide-react";
import type { ISvgIcons } from "@plane/propel/icons";
import type { TContextMenuItem } from "@plane/ui";

export interface CopyMenuHelperProps {
  baseItem: {
    key: string;
    title: string;
    icon: React.FC<ISvgIcons>;
    action: () => void;
    shouldRender: boolean;
  };
  activeLayout: string;
  setCreateUpdateIssueModal: (open: boolean) => void;
  setDuplicateWorkItemModal?: (open: boolean) => void;
  workspaceSlug?: string;
}

export const createCopyMenuWithDuplication = (props: CopyMenuHelperProps): TContextMenuItem => {
  const { baseItem, setDuplicateWorkItemModal } = props;

  if (!setDuplicateWorkItemModal) return baseItem;

  return {
    ...baseItem,
    nestedMenuItems: [
      {
        key: "copy-work-item",
        title: baseItem.title,
        icon: baseItem.icon,
        action: baseItem.action,
      },
      {
        key: "duplicate-work-item",
        title: "Duplicate",
        icon: CopyPlus,
        action: () => setDuplicateWorkItemModal(true),
      },
    ],
  };
};
