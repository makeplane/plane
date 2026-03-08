/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import type { TIssueActivityComment } from "@plane/types";

type TIssueActivityWorklog = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends?: "top" | "bottom";
};

export function IssueActivityWorklog(_props: TIssueActivityWorklog) {
  return <></>;
}
