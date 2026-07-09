/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Layers, Tags, X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useFileLibrary } from "@/hooks/store/use-file-library";

/**
 * Applied-filters row mirroring the work-items header: active filters are shown
 * as pills grouped by property (Categorías / Tags), each value removable with an
 * X, plus a "Clear all" action. Multiple values per property are OR'd.
 */
export const AppliedFiltersList = observer(function AppliedFiltersList() {
  const { t } = useTranslation();
  const { filters, toggleFilterValue, clearAllFilters, getCategoryById, getTagById } = useFileLibrary();

  const groups = [
    {
      key: "categories" as const,
      label: t("file_library.categories.title"),
      icon: Layers,
      values: filters.categories ?? [],
      nameOf: (id: string) => getCategoryById(id)?.name ?? id,
    },
    {
      key: "tags" as const,
      label: t("file_library.tags.title"),
      icon: Tags,
      values: filters.tags ?? [],
      nameOf: (id: string) => getTagById(id)?.name ?? id,
    },
  ];

  const hasAny = groups.some((group) => group.values.length > 0);
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-subtle px-2 py-1.5 sm:px-4">
      {groups
        .filter((group) => group.values.length > 0)
        .map((group) => (
          <div
            key={group.key}
            className="flex flex-wrap items-center gap-1.5 rounded-sm border border-subtle px-1.5 py-1"
          >
            <span className="flex items-center gap-1 text-11 text-tertiary">
              <group.icon className="size-3" />
              {group.label}
            </span>
            {group.values.map((id) => (
              <span
                key={id}
                className="flex items-center gap-1 rounded-sm bg-layer-2 px-1.5 py-0.5 text-11 font-medium"
              >
                {group.nameOf(id)}
                <button
                  type="button"
                  className="text-tertiary hover:text-danger-primary"
                  onClick={() => toggleFilterValue(group.key, id)}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ))}

      <button
        type="button"
        className="ml-auto rounded-sm px-1.5 py-1 text-12 text-tertiary hover:text-danger-primary"
        onClick={() => clearAllFilters()}
      >
        {t("file_library.filters.clear_all")}
      </button>
    </div>
  );
});
