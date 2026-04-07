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

import type { Dispatch, RefObject, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";
// plane imports
import type { ISvgIcons } from "@plane/propel/icons";
import type { TPageNavigationTabs } from "@plane/types";

// Basic section details type
export type SectionDetails = {
  label: string;
  icon: LucideIcon | React.FC<ISvgIcons>;
};

// Map of section types to details
export type SectionDetailsMap = {
  [key in TPageNavigationTabs]: SectionDetails;
};

// Props for section header
export interface SectionHeaderProps {
  sectionType: TPageNavigationTabs;
  sectionDetails: SectionDetails;
  isCreatingPage: TPageNavigationTabs | null;
  canCreatePage: boolean;
  handleCreatePage: (pageType: TPageNavigationTabs) => void;
  buttonRef?: RefObject<HTMLButtonElement>;
  onButtonClick?: () => void;
}

// Props for section content
export interface SectionContentProps {
  pageIds: string[];
  sectionType: TPageNavigationTabs;
  expandedPageIds?: string[];
  setExpandedPageIds?: Dispatch<SetStateAction<string[]>>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

// Props for main section component
export interface SectionRootProps {
  currentPageId?: string;
  expandedPageIds?: string[];
  sectionType: TPageNavigationTabs;
  setExpandedPageIds?: Dispatch<SetStateAction<string[]>>;
}

// Return type for drag and drop hook
export interface DragAndDropHookReturn {
  isDropping: boolean;
}
