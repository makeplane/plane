/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

export const HomePeekOverviewsRoot = observer(function HomePeekOverviewsRoot() {
  const { peekIssue } = useIssueDetail();

  return peekIssue ? <IssuePeekOverview /> : null;
});
