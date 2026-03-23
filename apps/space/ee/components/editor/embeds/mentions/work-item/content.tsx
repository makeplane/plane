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
// plane imports
import type { TEditorWorkItemMention } from "@plane/types";
import { formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
// local imports
import { EditorWorkItemMentionLogo } from "./logo";

type Props = {
  workItemDetails: TEditorWorkItemMention;
};

export const EditorWorkItemMentionContent = observer(function EditorWorkItemMentionContent(props: Props) {
  const { workItemDetails } = props;
  // derived values
  const trimmedName =
    workItemDetails.name.length > 64 ? workItemDetails.name.slice(0, 64) + "..." : workItemDetails.name;

  return (
    <span className="not-prose inline-flex items-center gap-1 w-fit text-13 font-medium">
      <EditorWorkItemMentionLogo
        className="shrink-0 size-3"
        stateColor={workItemDetails.state__color}
        stateGroup={workItemDetails.state__group}
      />
      <span className="text-tertiary">
        {formatProjectWorkItemIdentifierForDisplay(workItemDetails.project__identifier, workItemDetails.sequence_id)}
      </span>
      <span className="text-secondary">{trimmedName}</span>
    </span>
  );
});
