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

// local imports
import type { TEditorMentionComponentProps } from "./mention-root";
import { EditorWorkItemMention } from "./work-item";

export const EditorAdditionalMentionsRoot: React.FC<TEditorMentionComponentProps> = (props) => {
  const { entity_name } = props;

  switch (entity_name) {
    case "issue_mention":
      return <EditorWorkItemMention {...props} />;
  }
};
