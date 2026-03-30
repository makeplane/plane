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

import { CloseIcon } from "@plane/propel/icons";
import type { ISearchIssueResponse } from "@plane/types";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";

type Props = {
  epic: ISearchIssueResponse;
  onRemove: () => void;
};

export function SelectedEpicChip({ epic, onRemove }: Props) {
  return (
    <div className="flex items-center gap-1 whitespace-nowrap rounded-md border border-subtle bg-layer-1-hover py-1 pl-2 text-11 text-primary">
      <IssueIdentifier
        projectId={epic.project_id}
        issueTypeId={epic.type_id}
        projectIdentifier={epic.project__identifier}
        issueSequenceId={epic.sequence_id}
        size="xs"
        variant="secondary"
      />
      <button type="button" className="group p-1" onClick={onRemove}>
        <CloseIcon className="h-3 w-3 text-secondary group-hover:text-primary" />
      </button>
    </div>
  );
}
