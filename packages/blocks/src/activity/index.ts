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

// Shared types (used by multiple components)
export type { ActivityTab, ReactionChip, ThreadSummary, CommentSource, PropertyValue, ActivityItemData } from "./types";

// Components + co-located prop types
export { ActivityHeader } from "./activity-header";
export type { ActivityHeaderProps } from "./activity-header";

export {
  TimelineContainer,
  TimelineItem,
  TimelineItemIcon,
  TimelineConnector,
  TimelineTimestamp,
  TimelineConnectorLine,
  TIMELINE_CONNECTOR_LEFT,
  TIMELINE_CONNECTOR_WIDTH,
} from "./timeline";
export type {
  TimelineItemIconProps,
  TimelineConnectorProps,
  TimelineTimestampProps,
  TimelineItemProps,
  TimelineContainerProps,
} from "./timeline";

export { CommentBlock, CommentHeader, CommentActions, CommentThreadSummary } from "./comment-block";
export type { CommentBlockProps } from "./comment-block";

export { CollapsedGroup } from "./collapsed-group";
export type { CollapsedGroupProps } from "./collapsed-group";

export { TransitionRow, PropertyValueDisplay, mapActivityToPropertyValues } from "./transition-row";
export type { TransitionRowProps } from "./transition-row";

export { ActivityFeed } from "./activity-feed";
export type { ActivityFeedProps } from "./activity-feed";

export { ActivityListItem } from "./activity-list-item";
export type { ActivityListItemProps } from "./activity-list-item";

export { LabelActivityChip } from "./label-activity-chip";
export type { LabelActivityChipProps } from "./label-activity-chip";

export { WorklogBlock } from "./worklog-block";
export type { WorklogBlockProps } from "./worklog-block";
