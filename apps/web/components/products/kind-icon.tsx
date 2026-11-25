/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CalendarOutline, CubeOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";

/** Marks a work item as a product or a meeting. Tasks have no mark. */
export function KindIcon({ kind }: { kind: string | null | undefined }) {
  const { t } = useTranslation();
  if (kind !== "product" && kind !== "meeting") return null;
  const Glyph = kind === "product" ? CubeOutline : CalendarOutline;

  return (
    // oxlint-disable-next-line jsx_a11y/prefer-tag-over-role
    <span role="img" aria-label={t(`product.kinds.${kind}`)} className="shrink-0">
      <Glyph className="size-3.5 text-accent-primary" />
    </span>
  );
}
