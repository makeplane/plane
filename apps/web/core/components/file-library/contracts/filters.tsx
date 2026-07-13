/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Check, Filter, Search, X } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Popover } from "@plane/propel/popover";
import type { TContractFilters, TFileTag, TFileTagKind } from "@plane/types";
import { cn } from "@plane/utils";
// services
import { fileLibraryService } from "@/services/file-library.service";
// local imports
import { CONTRACT_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS, PROCESSING_STATUS_OPTIONS } from "./constants";

type Props = {
  workspaceSlug: string;
  filters: TContractFilters;
  onChange: (next: Partial<TContractFilters>) => void;
};

/** Workspace file tags (SWR-deduped between the dropdown and the pills row) */
const useWorkspaceTags = (workspaceSlug: string) => {
  const { data } = useSWR<TFileTag[]>(
    `FILE_LIBRARY_TAGS_LIST_${workspaceSlug}`,
    () => fileLibraryService.getTags(workspaceSlug),
    { revalidateOnFocus: false }
  );
  return data ?? [];
};

/** Section order + labels for the kind-grouped tag lists */
export const TAG_KIND_SECTIONS: { kind: TFileTagKind; i18nKey: string }[] = [
  { kind: "ARTIST", i18nKey: "file_library.tags.kinds.artist" },
  { kind: "GROUP", i18nKey: "file_library.tags.kinds.group" },
  { kind: "PERSON", i18nKey: "file_library.tags.kinds.person" },
  { kind: "CUSTOM", i18nKey: "file_library.tags.kinds.custom" },
];

export const groupTagsByKind = (tags: TFileTag[]) => {
  const groups = new Map<TFileTagKind, TFileTag[]>();
  tags.forEach((tag) => {
    const kind: TFileTagKind = tag.kind ?? "CUSTOM";
    groups.set(kind, [...(groups.get(kind) ?? []), tag]);
  });
  return groups;
};

const MULTI_SECTIONS = [
  { key: "estatus" as const, i18nKey: "file_library.contracts.fields.estatus_contrato", options: CONTRACT_STATUS_OPTIONS },
  { key: "tipo" as const, i18nKey: "file_library.contracts.fields.tipo_contrato", options: CONTRACT_TYPE_OPTIONS },
  {
    key: "processing_status" as const,
    i18nKey: "file_library.contracts.fields.processing_status",
    options: PROCESSING_STATUS_OPTIONS,
  },
];

/** Filters over the AI-extracted contract data (multi-value like work items) */
export function ContractFiltersDropdown(props: Props) {
  const { workspaceSlug, filters, onChange } = props;
  const { t } = useTranslation();
  const workspaceTags = useWorkspaceTags(workspaceSlug);
  const [tagSearch, setTagSearch] = useState("");
  const visibleTags = tagSearch.trim()
    ? workspaceTags.filter((tag) => tag.name.toLowerCase().includes(tagSearch.trim().toLowerCase()))
    : workspaceTags;

  const activeCount =
    (filters.estatus?.length ?? 0) +
    (filters.tipo?.length ?? 0) +
    (filters.processing_status?.length ?? 0) +
    (filters.tags?.length ?? 0) +
    (filters.person ? 1 : 0) +
    (filters.artist ? 1 : 0) +
    (filters.year ? 1 : 0) +
    (filters.fecha_fin_efectiva_after ? 1 : 0) +
    (filters.fecha_fin_efectiva_before ? 1 : 0);

  const toggleValue = <K extends "estatus" | "tipo" | "processing_status" | "tags">(key: K, value: string) => {
    const current = (filters[key] ?? []) as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ [key]: next.length > 0 ? next : undefined } as Partial<TContractFilters>);
  };

  const textFilter = (key: "person" | "artist" | "year", placeholderKey: string, type = "text") => (
    <input
      type={type}
      value={filters[key] ?? ""}
      onChange={(e) => onChange({ [key]: e.target.value || undefined })}
      placeholder={t(placeholderKey)}
      className="w-full rounded-sm border border-subtle bg-transparent px-2 py-1 text-12"
    />
  );

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
      {/* The propel Popover portals to <body> without a z-index — raise it above
          sticky table headers and the peek panel (z-[25]) */}
      <Popover.Panel side="bottom" align="start" positionerClassName="z-[30]">
        <div className="max-h-[70vh] w-72 space-y-2.5 overflow-y-auto rounded-md border border-subtle bg-layer-1 p-2.5 shadow-raised-200">
          {/* Free-text filters resolved by the database (icontains) */}
          <div className="space-y-1.5">
            <p className="text-11 font-medium text-tertiary">{t("file_library.contracts.filters.people")}</p>
            {textFilter("person", "file_library.contracts.filters.person_placeholder")}
            {textFilter("artist", "file_library.contracts.filters.artist_placeholder")}
            {textFilter("year", "file_library.contracts.filters.year_placeholder", "number")}
          </div>

          {/* Effective end date range (extension clauses included) */}
          <div className="space-y-1.5">
            <p className="text-11 font-medium text-tertiary">
              {t("file_library.contracts.fields.fecha_fin_efectiva")}
            </p>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filters.fecha_fin_efectiva_after ?? ""}
                onChange={(e) => onChange({ fecha_fin_efectiva_after: e.target.value || undefined })}
                className="w-full rounded-sm border border-subtle bg-transparent px-2 py-1 text-12"
              />
              <span className="text-11 text-tertiary">—</span>
              <input
                type="date"
                value={filters.fecha_fin_efectiva_before ?? ""}
                onChange={(e) => onChange({ fecha_fin_efectiva_before: e.target.value || undefined })}
                className="w-full rounded-sm border border-subtle bg-transparent px-2 py-1 text-12"
              />
            </div>
          </div>

          {/* Tags linked to the contract's document, grouped by kind so the
              list reads as artists / groups / people instead of a flat wall */}
          {workspaceTags.length > 0 && (
            <div>
              <p className="px-1 py-0.5 text-11 font-medium text-tertiary">{t("file_library.tags.title")}</p>
              <div className="relative mb-1 px-1">
                <Search className="absolute top-1/2 left-2.5 size-3 -translate-y-1/2 text-tertiary" />
                <input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder={t("file_library.filters.search_placeholder")}
                  className="w-full rounded-sm border border-subtle bg-transparent py-1 pr-2 pl-6 text-12"
                />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {TAG_KIND_SECTIONS.map(({ kind, i18nKey }) => {
                  const sectionTags = groupTagsByKind(visibleTags).get(kind) ?? [];
                  if (sectionTags.length === 0) return null;
                  return (
                    <div key={kind}>
                      <p className="px-2 pt-1.5 pb-0.5 text-10 font-semibold uppercase tracking-wide text-tertiary">
                        {t(i18nKey)}
                      </p>
                      {sectionTags.map((tag) => {
                        const isChecked = (filters.tags ?? []).includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-13 hover:bg-layer-1-hover"
                            onClick={() => toggleValue("tags", tag.id)}
                          >
                            <span
                              className={cn(
                                "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                                isChecked ? "border-accent-strong bg-accent-primary text-on-color" : "border-strong"
                              )}
                            >
                              {isChecked && <Check className="size-3" />}
                            </span>
                            <span className="truncate">{tag.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
                {visibleTags.length === 0 && (
                  <p className="px-2 py-1.5 text-11 text-tertiary">{t("file_library.filters.no_results")}</p>
                )}
              </div>
            </div>
          )}

          {/* Enum filters, OR'd within the group (incl. analysis state, e.g.
              "Completado" for contracts whose pipeline already finished) */}
          <div className="space-y-2">
            {MULTI_SECTIONS.map((section) => (
              <div key={section.key}>
                <p className="px-1 py-0.5 text-11 font-medium text-tertiary">{t(section.i18nKey)}</p>
                {section.options.map((option) => {
                  const isChecked = ((filters[section.key] ?? []) as string[]).includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-13 hover:bg-layer-1-hover"
                      onClick={() => toggleValue(section.key, option.value)}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                          isChecked ? "border-accent-strong bg-accent-primary text-on-color" : "border-strong"
                        )}
                      >
                        {isChecked && <Check className="size-3" />}
                      </span>
                      <span className="truncate">{t(option.i18nKey)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Popover.Panel>
    </Popover>
  );
}

/** Applied-filters pills row, work-items style: each value removable in place */
export function AppliedContractFilters(props: Props & { onClearAll: () => void }) {
  const { workspaceSlug, filters, onChange, onClearAll } = props;
  const { t } = useTranslation();
  const workspaceTags = useWorkspaceTags(workspaceSlug);

  const pills: { label: string; value: string; onRemove: () => void }[] = [];

  (filters.tags ?? []).forEach((tagId) => {
    pills.push({
      label: t("file_library.tags.title"),
      value: workspaceTags.find((tag) => tag.id === tagId)?.name ?? tagId,
      onRemove: () => {
        const next = (filters.tags ?? []).filter((id) => id !== tagId);
        onChange({ tags: next.length > 0 ? next : undefined });
      },
    });
  });

  MULTI_SECTIONS.forEach((section) => {
    ((filters[section.key] ?? []) as string[]).forEach((value) => {
      const option = section.options.find((o) => o.value === value);
      pills.push({
        label: t(section.i18nKey),
        value: option ? t(option.i18nKey) : value,
        onRemove: () => {
          const next = ((filters[section.key] ?? []) as string[]).filter((v) => v !== value);
          onChange({ [section.key]: next.length > 0 ? next : undefined } as Partial<TContractFilters>);
        },
      });
    });
  });
  if (filters.person)
    pills.push({
      label: t("file_library.contracts.filters.person"),
      value: filters.person,
      onRemove: () => onChange({ person: undefined }),
    });
  if (filters.artist)
    pills.push({
      label: t("file_library.contracts.filters.artist"),
      value: filters.artist,
      onRemove: () => onChange({ artist: undefined }),
    });
  if (filters.year)
    pills.push({
      label: t("file_library.contracts.filters.year"),
      value: filters.year,
      onRemove: () => onChange({ year: undefined }),
    });
  if (filters.fecha_fin_efectiva_after)
    pills.push({
      label: t("file_library.contracts.fields.fecha_fin_efectiva"),
      value: `≥ ${filters.fecha_fin_efectiva_after}`,
      onRemove: () => onChange({ fecha_fin_efectiva_after: undefined }),
    });
  if (filters.fecha_fin_efectiva_before)
    pills.push({
      label: t("file_library.contracts.fields.fecha_fin_efectiva"),
      value: `≤ ${filters.fecha_fin_efectiva_before}`,
      onRemove: () => onChange({ fecha_fin_efectiva_before: undefined }),
    });

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-subtle px-4 py-2">
      {pills.map((pill, index) => (
        <span
          key={`${pill.label}-${pill.value}-${index}`}
          className="flex items-center gap-1 rounded-full border border-subtle px-2 py-0.5 text-11"
        >
          <span className="text-tertiary">{pill.label}:</span>
          <span>{pill.value}</span>
          <button type="button" onClick={pill.onRemove} className="rounded-full p-0.5 hover:bg-layer-1-hover">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="rounded-full px-2 py-0.5 text-11 text-tertiary hover:bg-layer-1-hover"
      >
        {t("file_library.filters.clear_all")}
      </button>
    </div>
  );
}
