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

  // Tags render under kind subheaders (artists / groups / people / custom)
  // so long AI-generated lists stay scannable
  const TAG_KIND_ORDER: { kind: string; i18nKey: string }[] = [
    { kind: "ARTIST", i18nKey: "file_library.tags.kinds.artist" },
    { kind: "GROUP", i18nKey: "file_library.tags.kinds.group" },
    { kind: "PERSON", i18nKey: "file_library.tags.kinds.person" },
    { kind: "CUSTOM", i18nKey: "file_library.tags.kinds.custom" },
  ];
  const tagOptions = TAG_KIND_ORDER.flatMap(({ kind, i18nKey }) => {
    const group = tagIds
      .map((id) => getTagById(id))
      .filter((tag): tag is NonNullable<typeof tag> => !!tag && (tag.kind ?? "CUSTOM") === kind);
    return group.map((tag, index) => ({
      id: tag.id,
      name: tag.name,
      groupLabel: index === 0 ? t(i18nKey) : undefined,
    }));
  });

  const sections = [
    {
      key: "categories" as const,
      label: t("file_library.categories.title"),
      icon: Layers,
      selected: filters.categories ?? [],
      options: categoryIds.map((id) => ({
        id,
        name: getCategoryById(id)?.name ?? "",
        groupLabel: undefined as string | undefined,
      })),
    },
    {
      key: "tags" as const,
      label: t("file_library.tags.title"),
      icon: Tags,
      selected: filters.tags ?? [],
      options: tagOptions,
    },
  ];

  const query = search.trim().toLowerCase();

  return (
    <Popover modal>
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
      <Popover.Panel positionerClassName="z-100" side="bottom" align="start">
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
                      <div key={option.id}>
                        {/* Kind subheader (hidden while searching — results mix groups) */}
                        {option.groupLabel && !query && (
                          <p className="px-2 pt-1.5 pb-0.5 text-10 font-semibold uppercase tracking-wide text-tertiary">
                            {option.groupLabel}
                          </p>
                        )}
                        <button
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
                      </div>
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
