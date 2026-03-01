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

import type { FC } from "react";
import { Fragment } from "react";
import { observer } from "mobx-react";
// local imports
import { InboxIssueListItem } from "./intake-list-item";

export type InboxIssueListProps = {
  workspaceSlug: string;
  projectId: string;
  projectIdentifier?: string;
  inboxIssueIds: string[];
  setIsMobileSidebar: (value: boolean) => void;
};

export const InboxIssueList = observer(function InboxIssueList(props: InboxIssueListProps) {
  const { workspaceSlug, projectId, projectIdentifier, inboxIssueIds, setIsMobileSidebar } = props;

  return (
    <>
      {inboxIssueIds.map((inboxIssueId) => (
        <Fragment key={inboxIssueId}>
          <InboxIssueListItem
            setIsMobileSidebar={setIsMobileSidebar}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            projectIdentifier={projectIdentifier}
            inboxIssueId={inboxIssueId}
          />
        </Fragment>
      ))}
    </>
  );
});
