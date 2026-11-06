/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Badge } from "@makeplane/propel/components/badge";
import { Collapsible } from "@makeplane/propel/components/collapsible";
import {
  CodeOutline,
  DeleteOutline,
  EditOutline,
  FileOutline,
  GlobeOutline,
  SearchOutline,
  ShieldOutline,
  ThoughtsOutline,
  ToolOutline,
  ArrowCircleRightOutline,
} from "@makeplane/propel/icons";
import type { PendingPermission, ToolCallContent, ToolCallItem, ToolKind } from "@plane/acp-client";
import { useTranslation } from "@plane/i18n";
// local imports
import { formatJson, keyedByContent } from "../helpers";
import { PermissionPrompt } from "../permission-prompt";

const KIND_ICONS: Record<ToolKind, typeof ToolOutline> = {
  read: FileOutline,
  edit: EditOutline,
  delete: DeleteOutline,
  move: ArrowCircleRightOutline,
  search: SearchOutline,
  execute: CodeOutline,
  think: ThoughtsOutline,
  fetch: GlobeOutline,
  switch_mode: ShieldOutline,
  other: ToolOutline,
};

const STATUS_VARIANTS = {
  pending: "neutral",
  in_progress: "info",
  completed: "success",
  failed: "danger",
} as const;

function Code({ children }: { children: ReactNode }) {
  return (
    <pre className="font-mono max-h-64 overflow-auto rounded-sm bg-layer-2 p-2 text-caption-md-regular whitespace-pre-wrap text-secondary">
      {children}
    </pre>
  );
}

function ToolContent({ content }: { content: ToolCallContent }) {
  const { t } = useTranslation();
  if (content.type === "diff") {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-caption-md-medium text-tertiary">{t("agents.tool_call.changes", { path: content.path })}</p>
        {content.oldText != null && <Code>{content.oldText}</Code>}
        <Code>{content.newText}</Code>
      </div>
    );
  }
  if (content.type === "terminal") {
    return <p className="text-caption-md-regular text-tertiary">{t("agents.tool_call.terminal")}</p>;
  }
  const block = content.content;
  return <Code>{block.type === "text" ? block.text : formatJson(block)}</Code>;
}

function toolContentKey(content: ToolCallContent): string {
  if (content.type === "diff") return `diff:${content.path}`;
  if (content.type === "terminal") return `terminal:${content.terminalId}`;
  return "content";
}

type Props = {
  item: ToolCallItem;
  /** A pending permission request for this tool call, answered inline. */
  permission?: PendingPermission;
  onRespondToPermission: (permissionId: string, optionId: string | null) => void;
};

export function ToolCallCard({ item, permission, onRespondToPermission }: Props) {
  const { t } = useTranslation();
  const Icon = KIND_ICONS[item.toolKind] ?? ToolOutline;
  const input = formatJson(item.rawInput);
  const output = formatJson(item.rawOutput);
  const hasDetails = !!input || !!output || item.content.length > 0 || item.locations.length > 0;
  const title = item.title || t("agents.tool_call.untitled");

  const header = (
    <span className="flex min-w-0 items-center gap-2">
      <Icon className="size-4 flex-shrink-0 text-tertiary" />
      <span className="truncate text-body-xs-medium text-primary">{title}</span>
      <Badge variant={STATUS_VARIANTS[item.status]} size="sm" label={t(`agents.tool_call.status.${item.status}`)} />
    </span>
  );

  return (
    <div className="flex flex-col gap-2 rounded-md border border-subtle p-2">
      {hasDetails ? (
        <Collapsible trigger={header}>
          <div className="flex flex-col gap-2 pt-1">
            {item.locations.length > 0 && (
              <ul className="flex flex-col gap-0.5 text-caption-md-regular text-secondary">
                {item.locations.map((location) => (
                  <li key={`${location.path}:${location.line ?? ""}`} className="font-mono truncate">
                    {location.path}
                    {location.line != null ? `:${location.line}` : ""}
                  </li>
                ))}
              </ul>
            )}
            {input && (
              <div className="flex flex-col gap-1">
                <p className="text-caption-md-medium text-tertiary">{t("agents.tool_call.input")}</p>
                <Code>{input}</Code>
              </div>
            )}
            {keyedByContent(item.content, toolContentKey).map(({ key, item: content }) => (
              <ToolContent key={key} content={content} />
            ))}
            {output && (
              <div className="flex flex-col gap-1">
                <p className="text-caption-md-medium text-tertiary">{t("agents.tool_call.output")}</p>
                <Code>{output}</Code>
              </div>
            )}
          </div>
        </Collapsible>
      ) : (
        <div className="px-1 py-0.5">{header}</div>
      )}
      {permission && <PermissionPrompt permission={permission} onRespond={onRespondToPermission} />}
    </div>
  );
}
