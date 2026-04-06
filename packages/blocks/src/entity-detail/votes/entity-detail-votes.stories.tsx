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
import { EntityDetailVotes } from "./entity-detail-votes";
import { MOCK_VOTES } from "../_mock-data";

const meta = preview.meta({
  title: "EntityDetail/Votes",
  component: EntityDetailVotes,
  parameters: { layout: "centered" },
});

export const Default = meta.story({
  args: {
    upVotesCount: MOCK_VOTES.upVotesCount,
    downVotesCount: MOCK_VOTES.downVotesCount,
    isUpVotedByUser: false,
    isDownVotedByUser: false,
    onUpVote: () => {},
    onDownVote: () => {},
    onCountClick: (_voteType: "upvotes" | "downvotes") => {},
  },
});

export const UpVotedByUser = meta.story({
  args: {
    upVotesCount: MOCK_VOTES.upVotesCount,
    downVotesCount: MOCK_VOTES.downVotesCount,
    isUpVotedByUser: true,
    isDownVotedByUser: false,
    onUpVote: () => {},
    onDownVote: () => {},
    onCountClick: (_voteType: "upvotes" | "downvotes") => {},
  },
});

export const Disabled = meta.story({
  args: {
    upVotesCount: MOCK_VOTES.upVotesCount,
    downVotesCount: MOCK_VOTES.downVotesCount,
    isUpVotedByUser: false,
    isDownVotedByUser: false,
    onUpVote: () => {},
    onDownVote: () => {},
    onCountClick: (_voteType: "upvotes" | "downvotes") => {},
    disabled: true,
  },
});
