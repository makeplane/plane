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

import { observer } from "mobx-react";
import { useCallback } from "react";
// plane imports
import type { TStateGroups } from "@plane/types";
import { formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
import type { TWorkItemMentionResponse } from "@/types";
// local imports
import { EditorWorkItemMentionLogo } from "./logo";

type Props = {
  workItemDetails: TWorkItemMentionResponse;
  workspaceSlug: string;
};

export const EditorWorkItemMentionContent: React.FC<Props> = observer((props) => {
  const { workItemDetails, workspaceSlug } = props;
  // derived values
  const trimmedName =
    workItemDetails.name && workItemDetails.name.length > 64
      ? workItemDetails.name.slice(0, 64) + "..."
      : workItemDetails.name;
  // handle click to open the peek overview
  const handleClick = useCallback(() => {
    if (!workItemDetails || !workItemDetails.projectId || !workspaceSlug) return;
  }, [workItemDetails, workspaceSlug]);

  return (
    <button
      type="button"
      className="group/work-item-mention not-prose inline-flex items-center gap-1 w-fit text-sm font-medium outline-none"
      onClick={handleClick}
    >
      <EditorWorkItemMentionLogo className="shrink-0 size-3" stateGroup={workItemDetails.stateGroup as TStateGroups} />
      <span className="text-custom-text-300">
        {formatProjectWorkItemIdentifierForDisplay(workItemDetails.projectIdentifier, workItemDetails.sequenceId)}
      </span>
      <span className="text-custom-text-200 group-hover/work-item-mention:text-custom-text-100 transition-colors">
        {trimmedName}
      </span>
    </button>
  );
});
