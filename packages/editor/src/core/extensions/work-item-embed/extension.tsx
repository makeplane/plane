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

import { ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
// local imports
import { WorkItemEmbedExtensionConfig } from "./extension-config";
import type { TWorkItemEmbedWidgetCallback } from "./node-view";
import { WorkItemEmbedNodeView } from "./node-view";

type Props = {
  widgetCallback: TWorkItemEmbedWidgetCallback;
};

export function WorkItemEmbedExtension(props: Props) {
  return WorkItemEmbedExtensionConfig.extend({
    addNodeView() {
      return ReactNodeViewRenderer((issueProps: NodeViewProps) => (
        <WorkItemEmbedNodeView nodeViewProps={issueProps} widgetCallback={props.widgetCallback} />
      ));
    },
  });
}
