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

import type { CSSProperties } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { INITIATIVE_STATES } from "@plane/constants";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { InitiativeIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { ControlLink } from "@plane/ui";
import { renderFormattedDate } from "@plane/utils";
// components
import { SIDEBAR_WIDTH } from "@/components/timeline/constants";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  initiativeId: string;
};

export const InitiativeTimelineBlock = observer(function InitiativeTimelineBlock(props: Props) {
  const { initiativeId } = props;
  const { isMobile } = usePlatformOS();
  const { workspaceSlug } = useParams();
  const {
    initiative: { getInitiativeById, setPeekInitiative },
  } = useInitiatives();

  const initiative = getInitiativeById(initiativeId);

  if (!initiative) return null;

  // Get state color
  const stateColor = INITIATIVE_STATES[initiative.state]?.color ?? "#60646c";

  // Generate block style similar to issues
  const isBlockVisibleOnChart = initiative.start_date || initiative.end_date;
  const isBlockComplete = initiative.start_date && initiative.end_date;

  let message;
  const blockStyle: CSSProperties = {
    backgroundColor: stateColor,
  };

  if (isBlockVisibleOnChart && !isBlockComplete) {
    if (initiative.start_date) {
      message = `From ${renderFormattedDate(initiative.start_date)}`;
      blockStyle.maskImage = `linear-gradient(to right, ${stateColor} 50%, transparent 95%)`;
    } else if (initiative.end_date) {
      message = `Till ${renderFormattedDate(initiative.end_date)}`;
      blockStyle.maskImage = `linear-gradient(to left, ${stateColor} 50%, transparent 95%)`;
    }
  } else if (isBlockComplete) {
    message = `${renderFormattedDate(initiative.start_date)} to ${renderFormattedDate(initiative.end_date)}`;
  }

  const handleClick = (e: React.MouseEvent) => {
    // If command/ctrl + click, open in new tab
    if (e.metaKey || e.ctrlKey) {
      const url = `/${workspaceSlug}/initiatives/${initiative.id}`;
      window.open(url, "_blank");
      return;
    }
    // Otherwise open peek view
    setPeekInitiative({ workspaceSlug: workspaceSlug.toString(), initiativeId });
  };

  return (
    <Tooltip
      isMobile={isMobile}
      tooltipContent={
        <div className="space-y-1">
          <h5>{initiative.name}</h5>
          <div>{message}</div>
        </div>
      }
      position="bottom-start"
      className="z-auto"
      disabled={!message}
    >
      <div
        id={`initiative-${initiativeId}`}
        className="relative flex h-full w-full cursor-pointer items-center rounded-sm space-between"
        style={blockStyle}
        onClick={handleClick}
      >
        <div className="absolute left-0 top-0 h-full w-full bg-surface-1/50 " />
        <div
          className="sticky w-auto overflow-hidden truncate px-2.5 py-1 text-13 text-primary flex-1"
          style={{ left: `${SIDEBAR_WIDTH}px` }}
        >
          {initiative.name}
        </div>
      </div>
    </Tooltip>
  );
});

// Rendering initiatives on gantt sidebar - just the content
export const InitiativeTimelineSidebarBlock = observer(function InitiativeTimelineSidebarBlock(props: Props) {
  const { initiativeId } = props;
  const { workspaceSlug } = useParams();
  const { isMobile } = usePlatformOS();

  const {
    initiative: { getInitiativeById, setPeekInitiative },
  } = useInitiatives();

  const initiative = getInitiativeById(initiativeId);

  if (!initiative) return null;

  const handleControlLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    e.preventDefault();
    // If command/ctrl + click, open in new tab
    if (e.metaKey || e.ctrlKey) {
      const url = `/${workspaceSlug}/initiatives/${initiative.id}`;
      window.open(url, "_blank");
      return;
    }
    // Otherwise open peek view
    setPeekInitiative({ workspaceSlug: workspaceSlug.toString(), initiativeId });
  };

  return (
    <ControlLink
      id={`initiative-${initiativeId}`}
      href={`/${workspaceSlug}/initiatives/${initiative.id}`}
      className="line-clamp-1 w-full cursor-pointer text-13 text-primary"
      onClick={handleControlLinkClick}
    >
      <div className="relative flex h-full w-full cursor-pointer items-center gap-2">
        {initiative?.logo_props?.in_use ? (
          <Logo logo={initiative?.logo_props} size={14} type="lucide" />
        ) : (
          <InitiativeIcon className="h-3.5 w-3.5 text-tertiary flex-shrink-0" />
        )}
        <Tooltip tooltipContent={initiative.name} isMobile={isMobile}>
          <span className="flex-grow truncate text-13 font-medium">{initiative.name}</span>
        </Tooltip>
      </div>
    </ControlLink>
  );
});
