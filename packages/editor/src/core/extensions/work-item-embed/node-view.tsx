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

export type TWorkItemEmbedWidgetCallback = (props: {
  issueId: string;
  projectId: string | undefined;
  workspaceSlug: string | undefined;
}) => React.ReactNode;

type Props = {
  nodeViewProps: NodeViewProps;
  widgetCallback: TWorkItemEmbedWidgetCallback;
};

export function WorkItemEmbedNodeView({ nodeViewProps, widgetCallback }: Props) {
  const { decorations, node } = nodeViewProps;

  return (
    <YChangeNodeViewWrapper decorations={decorations} className="work-item-embed-component">
      {widgetCallback({
        issueId: node.attrs.entity_identifier,
        projectId: node.attrs.project_identifier,
        workspaceSlug: node.attrs.workspace_identifier,
      })}
    </YChangeNodeViewWrapper>
  );
}
