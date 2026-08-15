/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// local imports
import type { TCallbackMentionComponentProps } from "@plane/editor";
import { EditorIssueMention } from "./issue";
import { EditorProjectMention } from "./project";
import { EditorUserMention } from "./user";

export function EditorMentionsRoot(props: TCallbackMentionComponentProps) {
  const { entity_identifier, entity_name, entity_display_name } = props;

  switch (entity_name) {
    case "user_mention":
      return <EditorUserMention id={entity_identifier} />;
    case "issue":
      return <EditorIssueMention id={entity_identifier} entityDisplayName={entity_display_name} />;
    case "project":
      return <EditorProjectMention id={entity_identifier} entityDisplayName={entity_display_name} />;
    default:
      return null;
  }
}
