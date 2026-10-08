/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { TIssueType } from "@plane/types";
// local imports
import { IssueTypeListItem } from "./issue-type-list-item";

type Props = {
  issueTypes: TIssueType[];
  onEdit: (issueType: TIssueType) => void;
  onDelete: (issueType: TIssueType) => void;
  onEnableDisable: (issueType: TIssueType) => Promise<void>;
};

export const IssueTypesList = observer(function IssueTypesList(props: Props) {
  const { issueTypes, onEdit, onDelete, onEnableDisable } = props;

  return (
    <div className="flex flex-col divide-y divide-subtle rounded-md border border-subtle">
      {issueTypes.map((issueType) => (
        <IssueTypeListItem
          key={issueType.id}
          issueType={issueType}
          onEdit={onEdit}
          onDelete={onDelete}
          onEnableDisable={onEnableDisable}
        />
      ))}
    </div>
  );
});
