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
import { EntityDetailVotesModal } from "./entity-detail-votes-modal";
import { MOCK_VOTERS, MOCK_VOTES } from "../_mock-data";

const meta = preview.meta({
  title: "EntityDetail/VotesModal",
  component: EntityDetailVotesModal,
  parameters: { layout: "centered" },
});

export const Default = meta.story({
  args: {
    isOpen: true,
    onClose: () => {},
    upVotes: MOCK_VOTERS.upVotes,
    downVotes: MOCK_VOTERS.downVotes,
    upVotesCount: MOCK_VOTES.upVotesCount,
    downVotesCount: MOCK_VOTES.downVotesCount,
  },
});

export const EmptyLists = meta.story({
  args: {
    isOpen: true,
    onClose: () => {},
    upVotes: [],
    downVotes: [],
    upVotesCount: 0,
    downVotesCount: 0,
  },
});
