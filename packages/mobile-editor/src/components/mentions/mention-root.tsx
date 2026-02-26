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
import type { TCallbackMentionComponentProps } from "@plane/editor";
import type { TEditorMentionType } from "@plane/types";
// local types
import type { TWorkItemMentionResponse } from "@/types";
// local components
import { EditorAdditionalMentionsRoot } from "./additional-mentions-root";
import { EditorUserMention } from "./user-mention";

export type TEditorMentionComponentProps = TCallbackMentionComponentProps & {
  getMentionDetails?: (mentionType: TEditorMentionType, entityId: string) => TWorkItemMentionResponse | undefined;
  workspaceSlug: string;
  currentUserId: string;
};

export const EditorMentionsRoot: React.FC<TEditorMentionComponentProps> = (props) => {
  const { entity_identifier, entity_name, currentUserId } = props;

  switch (entity_name) {
    case "user_mention":
      return <EditorUserMention id={entity_identifier} currentUserId={currentUserId} />;
    default:
      return <EditorAdditionalMentionsRoot {...props} />;
  }
};
