/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  AnalyticsOutline,
  ArchiveOutline,
  CyclesOutline,
  DraftsOutline,
  HomeOutline,
  InboxOutline,
  MultipleStickyOutline,
  ProjectsOutline,
  ViewsOutline,
  YourWorkOutline,
} from "@makeplane/propel/icons";
import { cn } from "@plane/utils";

export const getSidebarNavigationItemIcon = (key: string, className: string = "") => {
  switch (key) {
    case "home":
      return <HomeOutline className={cn("size-4 flex-shrink-0", className)} />;
    case "inbox":
      return <InboxOutline className={cn("size-4 flex-shrink-0", className)} />;
    case "projects":
      return <ProjectsOutline className={cn("size-4 flex-shrink-0", className)} />;
    case "views":
      return <ViewsOutline className={cn("size-4 flex-shrink-0", className)} />;
    case "active_cycles":
      return <CyclesOutline className={cn("size-4 flex-shrink-0", className)} />;
    case "analytics":
      return <AnalyticsOutline className={cn("size-4 flex-shrink-0", className)} />;
    case "your_work":
      return <YourWorkOutline className={cn("size-4 flex-shrink-0", className)} />;
    case "drafts":
      return <DraftsOutline className={cn("size-4 flex-shrink-0", className)} />;
    case "archives":
      return <ArchiveOutline className={cn("size-4 flex-shrink-0", className)} />;
    case "stickies":
      return <MultipleStickyOutline className={cn("size-4 flex-shrink-0", className)} />;
  }
};
