"use client";

import * as React from "react";
import type {
  DocxCommentCardRenderProps,
  DocxDocumentTheme,
  DocxTrackedChangeCardRenderProps,
} from "@extend-ai/react-docx";

import { Badge } from "./badge";
import { Card } from "./card";

function trackedChangeBadgeVariant(
  kind: DocxTrackedChangeCardRenderProps["change"]["kind"]
): React.ComponentProps<typeof Badge>["variant"] {
  switch (kind) {
    case "insertion":
    case "move-to":
      return "success";
    case "deletion":
    case "move-from":
      return "error";
    default:
      return "warning";
  }
}

function trackedChangeBadgeLabel({
  change,
  kindLabel,
}: Pick<DocxTrackedChangeCardRenderProps, "change" | "kindLabel">) {
  switch (change.kind) {
    case "insertion":
      return "Inserted";
    case "deletion":
      return "Removed";
    case "move-from":
      return "Moved from";
    case "move-to":
      return "Moved to";
    default:
      return kindLabel;
  }
}

function DocxAnnotationCard({
  anchorText,
  badge,
  badgeVariant = "outline",
  date,
  meta,
  documentTheme,
  snippet,
  style,
}: {
  anchorText?: string;
  badge: string;
  badgeVariant?: React.ComponentProps<typeof Badge>["variant"];
  date?: string;
  documentTheme: DocxDocumentTheme;
  meta: string;
  snippet: string;
  style: React.CSSProperties;
}) {
  const isDarkDocument = documentTheme === "dark";
  const cardStyle: React.CSSProperties = {
    ...style,
    backgroundColor: isDarkDocument ? "rgb(24 24 27 / 0.95)" : "rgb(255 255 255 / 0.95)",
    color: isDarkDocument ? "#f4f4f5" : "#18181b",
  };
  const mutedTextColor = isDarkDocument ? "#a1a1aa" : "#71717a";
  const anchorStyle: React.CSSProperties = {
    backgroundColor: isDarkDocument ? "rgb(63 63 70 / 0.55)" : "rgb(244 244 245 / 0.75)",
    color: mutedTextColor,
  };

  return (
    <Card
      style={cardStyle}
      className="shadow-sm pointer-events-auto box-border gap-2 rounded-lg p-2 before:rounded-[7px]"
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 text-[11px] leading-tight font-medium" style={{ color: mutedTextColor }}>
          <div className="truncate">{meta}</div>
          {date ? <div className="mt-0.5 truncate">{date}</div> : null}
        </div>
        <Badge variant={badgeVariant} size="sm" className="max-w-[92px] truncate">
          {badge}
        </Badge>
      </div>
      {anchorText ? (
        <div className="rounded-md px-2 py-1 text-[11px] leading-snug italic" style={anchorStyle}>
          {anchorText}
        </div>
      ) : null}
      <div className="text-xs leading-snug break-words">{snippet}</div>
    </Card>
  );
}

export function createDocxTrackedChangeCardRenderer(documentTheme: DocxDocumentTheme) {
  return function renderDocxTrackedChangeCard({
    change,
    formattedDate,
    kindLabel,
    snippet,
    style,
  }: DocxTrackedChangeCardRenderProps) {
    return (
      <DocxAnnotationCard
        badge={trackedChangeBadgeLabel({ change, kindLabel })}
        badgeVariant={trackedChangeBadgeVariant(change.kind)}
        date={formattedDate}
        documentTheme={documentTheme}
        meta={change.author?.trim() || "Unknown author"}
        snippet={snippet}
        style={style}
      />
    );
  };
}

export function createDocxCommentCardRenderer(documentTheme: DocxDocumentTheme) {
  return function renderDocxCommentCard({ comment, formattedDate, snippet, style }: DocxCommentCardRenderProps) {
    const badge = comment.resolved ? "Resolved" : comment.parentId !== undefined ? "Reply" : "Comment";

    return (
      <DocxAnnotationCard
        anchorText={comment.anchorText}
        badge={badge}
        badgeVariant={comment.resolved ? "secondary" : "info"}
        date={formattedDate}
        documentTheme={documentTheme}
        meta={comment.author?.trim() || "Unknown author"}
        snippet={snippet}
        style={style}
      />
    );
  };
}
