/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
// extension config
import type { TMentionExtensionOptions } from "./extension-config";
// extension types
import type { TMentionComponentAttributes } from "./types";
import { EMentionComponentAttributeNames } from "./types";

export type MentionNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TMentionComponentAttributes;
  };
};

export function MentionNodeView(props: MentionNodeViewProps) {
  const {
    extension,
    node: { attrs },
  } = props;

  return (
    <NodeViewWrapper key={attrs[EMentionComponentAttributeNames.ID]} className="mention-component inline w-fit">
      {(extension.options as TMentionExtensionOptions).renderComponent({
        entity_identifier: attrs[EMentionComponentAttributeNames.ENTITY_IDENTIFIER] ?? "",
        entity_name: attrs[EMentionComponentAttributeNames.ENTITY_NAME] ?? "user_mention",
      })}
    </NodeViewWrapper>
  );
}
