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

import type { NodeViewProps } from "@tiptap/react";
// version diff support
import { YChangeNodeViewWrapper } from "@/components/editors/version-diff/extensions/ychange-node-view-wrapper";
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
    decorations,
  } = props;

  return (
    <YChangeNodeViewWrapper decorations={decorations} className="mention-component inline-flex max-w-full">
      {(extension.options as TMentionExtensionOptions).renderComponent({
        entity_identifier: attrs[EMentionComponentAttributeNames.ENTITY_IDENTIFIER] ?? "",
        entity_name: attrs[EMentionComponentAttributeNames.ENTITY_NAME] ?? "user_mention",
      })}
    </YChangeNodeViewWrapper>
  );
}
