/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCallbackMentionComponentProps } from "@plane/editor";
// local components
import { EditorUserMention } from "./user";

export function EditorMentionsRoot(props: TCallbackMentionComponentProps) {
  const { entity_identifier, entity_name } = props;

  switch (entity_name) {
    case "user_mention":
      return <EditorUserMention id={entity_identifier} />;
    default:
      return null;
  }
}
