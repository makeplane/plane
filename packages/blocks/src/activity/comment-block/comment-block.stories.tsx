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

import preview from "#.storybook/preview";
import { EllipsisVertical, Globe, Lock } from "lucide-react";
import { CommentBlock } from "./comment-block";
import { Avatar } from "@plane/propel/avatar";

const meta = preview.meta({
  title: "Activity/CommentBlock",
  component: CommentBlock,
  parameters: { layout: "centered" },
});

export const Default = meta.story({
  args: {
    avatar: <Avatar name="Amanda" size="sm" />,
    authorName: "Amanda",
    timestamp: "2h ago",
    body: "I've reviewed the design specs and everything looks great. Let's proceed with the implementation.",
    onReply: () => {},
    onAddReaction: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const WithReactions = meta.story({
  args: {
    avatar: <Avatar name="Ethan" size="sm" />,
    authorName: "Ethan Parker",
    timestamp: "5h ago",
    visibilityIcon: <Globe className="size-3.5 text-tertiary" />,
    body: "This needs a bit more work on the responsive layout. The sidebar collapses incorrectly on tablet viewports.",
    reactions: [
      { id: "thumbsup", emoji: "👍", count: 3, onClick: () => {} },
      { id: "tada", emoji: "🎉", count: 1, onClick: () => {} },
    ],
    onReply: () => {},
    onAddReaction: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const WithThreadSummary = meta.story({
  args: {
    avatar: <Avatar name="Sarah" size="sm" />,
    authorName: "Sarah Jones",
    timestamp: "1d ago",
    body: "Can someone take a look at the failing tests? I think the mocks need to be updated after the API changes.",
    onReply: () => {},
    onAddReaction: () => {},
    threadSummary: {
      avatars: [
        <Avatar key="0" name="Amanda" size="sm" />,
        <Avatar key="1" name="Ethan" size="sm" />,
        <Avatar key="2" name="John" size="sm" />,
      ],
      replyCount: 4,
      lastReplyTime: "3h ago",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const SlackThread = meta.story({
  args: {
    avatar: <Avatar name="John" size="sm" />,
    authorName: "John Miller",
    timestamp: "6h ago",
    body: "Just shared the updated mockups in the Slack channel. Check them out when you get a chance!",
    source: {
      icon: (
        <svg className="size-4" viewBox="0 0 16 16" fill="none">
          <rect width="16" height="16" rx="4" fill="#4A154B" />
          <text x="4" y="12" fill="white" fontSize="10" fontWeight="bold">
            S
          </text>
        </svg>
      ),
      label: "Thread from Slack",
      url: "https://slack.com",
    },
    onReply: () => {},
    onAddReaction: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const Highlighted = meta.story({
  args: {
    avatar: <Avatar name="Amanda" size="sm" />,
    authorName: "Amanda",
    timestamp: "just now",
    body: "This comment is highlighted for scroll-into-view deep linking.",
    highlighted: true,
    onReply: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const WithoutConnector = meta.story({
  args: {
    avatar: <Avatar name="Amanda" size="sm" />,
    authorName: "Amanda",
    timestamp: "10m ago",
    body: "Looks good to me! Approving.",
    showConnector: false,
    onReply: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const Edited = meta.story({
  args: {
    avatar: <Avatar name="Ethan" size="sm" />,
    authorName: "Ethan Parker",
    timestamp: "30m ago",
    body: "Updated the requirement: we need to support both landscape and portrait orientations on tablets. Please adjust the layout accordingly.",
    isEdited: true,
    onReply: () => {},
    onAddReaction: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const FullFeatured = meta.story({
  args: {
    avatar: <Avatar name="Sarah" size="sm" />,
    authorName: "Sarah Jones",
    timestamp: "6h ago",
    visibilityIcon: <Lock className="size-3.5 text-tertiary" />,
    body: "I've completed the final review of the authentication module. All edge cases are covered. The token refresh logic now handles concurrent requests properly. Marking this as ready for QA.",
    isEdited: true,
    reactions: [
      { id: "thumbsup", emoji: "👍", count: 5, isActive: true, onClick: () => {} },
      { id: "tada", emoji: "🎉", count: 3, onClick: () => {} },
      { id: "heart", emoji: "❤️", count: 1, onClick: () => {} },
    ],
    onReply: () => {},
    onAddReaction: () => {},
    threadSummary: {
      avatars: [
        <Avatar key="0" name="Amanda" size="sm" />,
        <Avatar key="1" name="Ethan" size="sm" />,
        <Avatar key="2" name="John" size="sm" />,
      ],
      replyCount: 7,
      lastReplyTime: "1h ago",
    },
    source: {
      icon: (
        <svg className="size-4" viewBox="0 0 16 16" fill="none">
          <rect width="16" height="16" rx="4" fill="#4A154B" />
          <text x="4" y="12" fill="white" fontSize="10" fontWeight="bold">
            S
          </text>
        </svg>
      ),
      label: "Thread from Slack",
      url: "https://slack.com",
    },
    headerActionsElement: (
      <button className="flex size-6 items-center justify-center rounded-md text-secondary hover:bg-layer-3">
        <EllipsisVertical className="size-3.5" />
      </button>
    ),
    footerElement: (
      <div className="flex items-center gap-2 rounded-lg bg-layer-3 px-3 py-2">
        <Globe className="size-3.5 text-tertiary" />
        <span className="text-caption-sm-regular text-tertiary">Visible to everyone in the project</span>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});
