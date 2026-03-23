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
import { StateGroupIcon } from "@plane/propel/icons";
import type { TEditorWorkItemMention } from "@plane/types";
import { formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
import { EditorWorkItemMentionLogo } from "./logo";

type Props = {
  workItemDetails: TEditorWorkItemMention;
};

export const EditorWorkItemMentionPreview = observer(function EditorWorkItemMentionPreview(props: Props) {
  const { workItemDetails } = props;

  return (
    <>
      <div className="flex items-center justify-between gap-3 text-secondary">
        <div className="shrink-0 flex items-center gap-1">
          <EditorWorkItemMentionLogo
            className="shrink-0 size-4"
            projectId={workItemDetails.project_id}
            showOnlyWorkItemType
            stateGroup={workItemDetails.state__group}
            workItemTypeId={workItemDetails.type_id}
          />
          <p className="text-11 font-medium">
            {formatProjectWorkItemIdentifierForDisplay(
              workItemDetails.project__identifier,
              workItemDetails.sequence_id
            )}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <StateGroupIcon stateGroup={workItemDetails.state__group} className="shrink-0 size-3" />
          <p className="text-11 font-medium">{workItemDetails.state__name}</p>
        </div>
      </div>
      <div>
        <h6 className="text-13 break-words">{workItemDetails.name}</h6>
      </div>
    </>
  );
});
