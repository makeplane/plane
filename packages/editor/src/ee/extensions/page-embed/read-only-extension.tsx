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

import type { Decoration } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
// version diff support
import { YChangeNodeViewWrapper } from "@/components/editors/version-diff/extensions/ychange-node-view-wrapper";
// types
import type { TPageEmbedConfig } from "@/types";
// extension config
import type { PageEmbedExtensionAttributes } from "./extension-config";
import { PageEmbedExtensionConfig } from "./extension-config";

type Props = {
  widgetCallback: TPageEmbedConfig["widgetCallback"];
};

export function PageEmbedReadOnlyExtension(props: Props) {
  return PageEmbedExtensionConfig.extend({
    selectable: false,
    draggable: false,

    addNodeView() {
      return ReactNodeViewRenderer(
        (embedProps: {
          node: { attrs: PageEmbedExtensionAttributes };
          editor: Editor;
          updateAttributes: (attrs: Partial<PageEmbedExtensionAttributes>) => void;
          decorations: readonly Decoration[];
        }) => (
          <YChangeNodeViewWrapper decorations={embedProps.decorations} className="page-embed-component">
            {props.widgetCallback({
              pageId: embedProps.node.attrs.entity_identifier as string,
              workspaceSlug: embedProps.node.attrs.workspace_identifier,
            })}
          </YChangeNodeViewWrapper>
        )
      );
    },
  });
}
