/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Check, Filter, Layers, Search, Tags } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Popover } from "@plane/propel/popover";
import { cn } from "@plane/utils";
// hooks
import { useFileLibrary } from "@/hooks/store/use-file-library";

/**
 * "Filtros" dropdown mirroring the work-items filter menu: opens a searchable
 * list of filterable properties (Categorías, Tags), each allowing multiple
 * values to be toggled on/off.
 */
export const FiltersDropdown = observer(function FiltersDropdown() {
  const { t } = useTranslation();
  const { filters, toggleFilterValue, categoryIds, getCategoryById, tagIds, getTagById } = useFileLibrary();
  const [search, setSearch] = useState("");

  const activeCount = (filters.categories?.length ?? 0) + (filters.tags?.length ?? 0);

  const sections = [
    {
      key: "categories" as const,
      label: t("file_library.categories.title"),
      icon: Layers,
      selected: filters.categories ?? [],
      options: categoryIds.map((id) => ({ id, name: getCategoryById(id)?.name ?? "" })),
    },
    {
      key: "tags" as const,
      label: t("file_library.tags.title"),
      icon: Tags,
      selected: filters.tags ?? [],
      options: tagIds.map((id) => ({ id, name: getTagById(id)?.name ?? "" })),
    },
  ];

  const query = search.trim().toLowerCase();

  return (
    <Popover>
      <Popover.Button
        className={cn(
          "flex items-center gap-1 rounded-sm border border-subtle px-2 py-1.5 text-12 hover:bg-layer-1-hover",
          activeCount > 0 ? "border-accent-strong text-accent-primary" : ""
        )}
      >
        <Filter className="size-3.5" />
        <span className="hidden sm:inline">{t("file_library.filters.button")}</span>
        {activeCount > 0 && (
          <span className="rounded-full bg-accent-primary px-1 text-10 text-on-color">{activeCount}</span>
        )}
      </Popover.Button>
      <Popover.Panel side="bottom" align="start">
        <div className="w-64 rounded-md border border-subtle bg-layer-1 p-2 shadow-raised-200">
          <div className="relative mb-1.5">
            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("file_library.filters.search_placeholder")}
              className="w-full rounded-sm border border-subtle bg-transparent py-1 pl-7 pr-2 text-12"
            />
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {sections.map((section) => {
              const options = section.options.filter((o) => !query || o.name.toLowerCase().includes(query));
              if (options.length === 0) return null;
              return (
                <div key={section.key}>
                  <p className="flex items-center gap-1 px-1 py-0.5 text-11 font-medium text-tertiary">
                    <section.icon className="size-3" />
                    {section.label}
                  </p>
                  {options.map((option) => {
                    const isChecked = section.selected.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-13 hover:bg-layer-1-hover"
                        onClick={() => toggleFilterValue(section.key, option.id)}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                            isChecked ? "border-accent-strong bg-accent-primary text-on-color" : "border-strong"
                          )}
                        >
                          {isChecked && <Check className="size-3" />}
                        </span>
                        <span className="truncate">{option.name}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Popover.Panel>
    </Popover>
  );
});
