/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import { BookOpen } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Card, ECardSpacing, ECardVariant } from "@plane/propel/card";
import { LUCIDE_ICONS_LIST } from "@plane/propel/emoji-icon-picker";
import type { THelpCategory } from "@/plane-web/types/help-center";

// Resolve the author-picked icon against the same curated list the admin icon
// picker uses (PascalCase names). Also accept a kebab-case name for resilience.
const ICON_BY_NAME = new Map(LUCIDE_ICONS_LIST.map((icon) => [icon.name, icon.element]));

const toPascalCase = (name: string) =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

const resolveIcon = (name: string) =>
  (name && (ICON_BY_NAME.get(name) ?? ICON_BY_NAME.get(toPascalCase(name)))) || BookOpen;

type Props = { category: THelpCategory; onSelect: (categoryId: string) => void };

export const CategoryCard = ({ category, onSelect }: Props) => {
  const { t } = useTranslation();
  const iconElement = resolveIcon(category.icon);
  return (
    <Card
      variant={ECardVariant.WITH_SHADOW}
      spacing={ECardSpacing.LG}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(category.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(category.id)}
      className="cursor-pointer gap-3 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong"
    >
      <span
        className="flex size-9 items-center justify-center rounded-md bg-surface-2"
        style={category.color ? { color: category.color } : undefined}
      >
        {createElement(iconElement, { className: category.color ? "size-5" : "size-5 text-icon-primary" })}
      </span>
      <div className="min-w-0">
        <h3 className="truncate text-15 font-medium text-primary">{category.name}</h3>
        <p className="mt-0.5 text-13 text-tertiary">
          {t("help_center.category_count_articles", { count: category.article_count })}
        </p>
      </div>
    </Card>
  );
};
