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

// plane imports
import type { TDeDupeIssue } from "@plane/types";
// local-imports
import { DeDupeIssueBlockContent } from "../issue-block/block-content";
import { DeDupeIssueBlockWrapper } from "../issue-block/block-wrapper";
import { DuplicateIssueReadOnlyHeaderRoot } from "./block-header";

type TDuplicateIssueReadOnlyBlockRootProps = {
  workspaceSlug: string;
  issue: TDeDupeIssue;
};

export function DuplicateIssueReadOnlyBlockRoot(props: TDuplicateIssueReadOnlyBlockRootProps) {
  const { workspaceSlug, issue } = props;
  return (
    <DeDupeIssueBlockWrapper workspaceSlug={workspaceSlug} issue={issue}>
      <DuplicateIssueReadOnlyHeaderRoot issue={issue} />
      <DeDupeIssueBlockContent issue={issue} />
    </DeDupeIssueBlockWrapper>
  );
}
