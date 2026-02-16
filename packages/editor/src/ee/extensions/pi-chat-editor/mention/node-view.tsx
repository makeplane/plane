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

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { BriefcaseIcon } from "lucide-react";
// plane imports
import { CycleIcon, ModuleIcon, LayersIcon, PageIcon, ViewsIcon, TeamsIcon, InitiativeIcon } from "@plane/propel/icons";
// local imports
import type { PiChatEditorMentionAttributes } from "./types";

export type PiChatEditorMentionNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: PiChatEditorMentionAttributes;
  };
};

const SelectedIcon = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case "pages":
      return <PageIcon className={className} />;
    case "cycles":
      return <CycleIcon className={className} />;
    case "modules":
      return <ModuleIcon className={className} />;
    case "projects":
      return <BriefcaseIcon className={className} />;
    case "issues":
      return <LayersIcon className={className} />;
    case "views":
      return <ViewsIcon className={className} />;
    case "teamspaces":
      return <TeamsIcon className={className} />;
    case "initiatives":
      return <InitiativeIcon className={className} />;
    default:
      return <LayersIcon className={className} />;
  }
};

export function PiChatEditorMentionNodeView(props: PiChatEditorMentionNodeViewProps) {
  // derived values
  const { redirect_uri, label, target } = props.node.attrs;

  return (
    <NodeViewWrapper
      as="a"
      href={redirect_uri}
      target="_blank"
      className="mention-component inline-flex w-fit items-center gap-1 rounded-sm bg-accent-primary/20 text-accent-primary px-1"
    >
      <SelectedIcon type={target ?? ""} className="size-[14px] flex-shrink-0" />
      {label}
    </NodeViewWrapper>
  );
}
