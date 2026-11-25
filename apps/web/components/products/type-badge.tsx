/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { CSSProperties } from "react";
import {
  CubeOutline,
  DocumentationOutline,
  FileOutline,
  FileSpreadsheetOutline,
  PresentationOutline,
  StickyNoteOutline,
  TableOutline,
} from "@makeplane/propel/icons";
// plane imports
import { Logo } from "@plane/blocks/emoji-icon-picker";
import type { TProductType } from "@plane/types";
import { cn } from "@plane/utils";

type TGlyph = React.FC<{ className?: string; style?: CSSProperties }>;

// The types every workspace starts with come without an icon and a color.
const INITIAL_TYPES: Record<string, { Glyph: TGlyph; color: string }> = {
  "Аналитическая презентация": { Glyph: PresentationOutline, color: "#d97706" },
  "Аналитическая записка": { Glyph: StickyNoteOutline, color: "#7c3aed" },
  Датасет: { Glyph: FileSpreadsheetOutline, color: "#059669" },
};
const GLYPHS: TGlyph[] = [CubeOutline, FileOutline, DocumentationOutline, TableOutline];
const COLORS = ["#2563eb", "#db2777", "#0891b2", "#ca8a04", "#4f46e5", "#dc2626"];

const hash = (text: string): number => [...text].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 7);

/** The admin's choice first, then the look of an initial type, then one that depends on the type only. */
export const getTypeColor = (type: TProductType): string =>
  type.color || INITIAL_TYPES[type.name]?.color || COLORS[hash(type.id) % COLORS.length];

export function ProductTypeIcon({ type, size = 14 }: { type: TProductType; size?: number }) {
  if (type.logo_props?.in_use) return <Logo logo={type.logo_props} size={size} type="lucide" />;
  const Glyph = INITIAL_TYPES[type.name]?.Glyph ?? GLYPHS[hash(type.id) % GLYPHS.length];
  return <Glyph className="shrink-0" style={{ color: getTypeColor(type), width: size, height: size }} />;
}

type Props = {
  type: TProductType | undefined;
  /** Number of products of the type, shown when given. */
  count?: number;
  isCompact?: boolean;
  title?: string;
  className?: string;
};

/** Icon and name of a product type on a tint of its color. Compact leaves the name to assistive technology. */
export function ProductTypeBadge(props: Props) {
  const { type, count, isCompact = false, title, className } = props;
  if (!type) return null;
  const color = getTypeColor(type);

  return (
    <span
      title={title ?? type.name}
      className={cn(
        "inline-flex h-5.5 max-w-full min-w-0 items-center gap-1.5 rounded-full border px-2 text-caption-md-medium text-primary",
        className
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
      }}
    >
      <ProductTypeIcon type={type} />
      <span className={isCompact ? "sr-only" : "truncate"}>{type.name}</span>
      {count !== undefined && <span className="shrink-0 text-secondary">{count}</span>}
    </span>
  );
}
