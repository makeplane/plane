/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Check, Combine, Folder, Lock, Pencil, Plus, Search, Trash2, X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Popover } from "@plane/propel/popover";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Input } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useFileLibrary } from "@/hooks/store/use-file-library";

export type TLabelItem = {
  id: string;
  name: string;
  isProtected?: boolean;
  pdfOnly?: boolean;
};

type LabelChecklistProps = {
  items: TLabelItem[];
  checkedIds: string[];
  onToggle: (id: string) => void;
  /** disables pdf-only items (e.g. when non-PDF files are affected) */
  disablePdfOnly?: boolean;
  onCreate: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  /** When provided, shows a "merge into…" action per item (tags only — folds
   * duplicate AI-extracted names like "H.H" and "Los H.H" into one). */
  onMerge?: (id: string, intoId: string) => Promise<void>;
  createPlaceholder: string;
};

/** Small "merge into…" picker popover, opened per row when onMerge is set. */
function MergeIntoPicker(props: { currentId: string; items: TLabelItem[]; onPick: (targetId: string) => void }) {
  const { currentId, items, onPick } = props;
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  // Focused on open via a ref rather than autoFocus: the attribute yanks focus
  // in ways screen readers can't announce, while this only fires once the
  // popover is actually on screen.
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    searchRef.current?.focus();
  }, []);
  const candidates = items.filter(
    (item) => item.id !== currentId && item.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Popover>
      <Popover.Button className="p-0.5" title={t("file_library.tags.merge_button")}>
        <Combine className="size-3" />
      </Popover.Button>
      <Popover.Panel side="right" align="start" positionerClassName="z-[30]">
        <div className="w-52 rounded-md border border-subtle bg-layer-1 p-1.5 shadow-raised-200">
          <p className="px-1 pb-1 text-11 font-medium text-tertiary">{t("file_library.tags.merge_into_hint")}</p>
          <div className="relative mb-1">
            <Search className="absolute top-1/2 left-2 size-3 -translate-y-1/2 text-tertiary" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("file_library.filters.search_placeholder")}
              className="w-full rounded-sm border border-subtle bg-transparent py-1 pr-2 pl-6 text-12"
            />
          </div>
          <div className="max-h-40 space-y-0.5 overflow-y-auto">
            {candidates.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full truncate rounded-sm px-1.5 py-1 text-left text-12 hover:bg-layer-1-hover"
                onClick={() => onPick(item.id)}
              >
                {item.name}
              </button>
            ))}
            {candidates.length === 0 && <p className="px-1.5 py-1 text-11 text-tertiary">—</p>}
          </div>
        </div>
      </Popover.Panel>
    </Popover>
  );
}

/** Checklist with inline create / rename / delete (protected items excluded). */
export const LabelChecklist = observer(function LabelChecklist(props: LabelChecklistProps) {
  const { items, checkedIds, onToggle, disablePdfOnly, onCreate, onRename, onDelete, onMerge, createPlaceholder } =
    props;
  const { t } = useTranslation();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: error?.name?.[0] ?? error?.error ?? t("error"),
      });
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim())
              void run(async () => {
                await onCreate(newName.trim());
                setNewName("");
              });
          }}
          placeholder={createPlaceholder}
          className="h-7 w-full text-12"
        />
        <button
          type="button"
          className="rounded-sm border border-subtle p-1.5 hover:bg-layer-1-hover disabled:opacity-50"
          disabled={!newName.trim()}
          onClick={() =>
            void run(async () => {
              await onCreate(newName.trim());
              setNewName("");
            })
          }
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="max-h-44 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isChecked = checkedIds.includes(item.id);
          const isDisabled = Boolean(item.pdfOnly && disablePdfOnly);
          const isEditing = editingId === item.id;
          return (
            <div
              key={item.id}
              className="group flex items-center gap-1.5 rounded-sm px-1.5 py-1 hover:bg-layer-1-hover"
            >
              {isEditing ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editingName.trim())
                        void run(async () => {
                          await onRename(item.id, editingName.trim());
                          setEditingId(null);
                        });
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-6 w-full text-12"
                    ref={(el) => el?.focus()}
                  />
                  <button
                    type="button"
                    className="p-0.5"
                    onClick={() =>
                      void run(async () => {
                        await onRename(item.id, editingName.trim());
                        setEditingId(null);
                      })
                    }
                  >
                    <Check className="size-3.5" />
                  </button>
                  <button type="button" className="p-0.5" onClick={() => setEditingId(null)}>
                    <X className="size-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isDisabled}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 text-left text-12",
                      isDisabled ? "cursor-not-allowed text-placeholder" : ""
                    )}
                    title={isDisabled ? t("file_library.categories.pdf_only_hint") : undefined}
                    onClick={() => onToggle(item.id)}
                  >
                    <span className="truncate">
                      {item.name}
                      {item.pdfOnly && <span className="ml-1 text-10 text-tertiary">PDF</span>}
                    </span>
                    {isChecked && <Check className="size-3.5 shrink-0 text-accent-primary" />}
                  </button>
                  {item.isProtected ? (
                    <Lock className="size-3 shrink-0 text-placeholder" />
                  ) : (
                    <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                      {onMerge && (
                        <MergeIntoPicker
                          currentId={item.id}
                          items={items}
                          onPick={(targetId) => void run(() => onMerge(item.id, targetId))}
                        />
                      )}
                      <button
                        type="button"
                        className="p-0.5"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditingName(item.name);
                        }}
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        type="button"
                        className="p-0.5 text-danger-primary"
                        onClick={() => void run(() => onDelete(item.id))}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })}
        {items.length === 0 && <p className="px-1.5 py-1 text-11 text-tertiary">—</p>}
      </div>
    </div>
  );
});

type FolderSelectProps = {
  value: string | null;
  onChange: (folderId: string | null) => void;
  allowCreate?: boolean;
  newFolderName?: string;
  onNewFolderNameChange?: (name: string) => void;
};

/** Flat folder picker with depth indentation, root option and optional new-folder input. */
export const FolderSelect = observer(function FolderSelect(props: FolderSelectProps) {
  const { value, onChange, allowCreate, newFolderName, onNewFolderNameChange } = props;
  const { t } = useTranslation();
  const { folderIds, getFolderById, getFolderPath } = useFileLibrary();

  const options = folderIds
    .map((id) => {
      const folder = getFolderById(id);
      if (!folder) return null;
      const path = getFolderPath(id);
      return { id, depth: path.length - 1, label: folder.name };
    })
    .filter(Boolean) as { id: string; depth: number; label: string }[];

  return (
    <div className="space-y-1.5">
      <div className="max-h-36 space-y-0.5 overflow-y-auto rounded-sm border border-subtle p-1">
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1 text-left text-12 hover:bg-layer-1-hover",
            value === null && !newFolderName ? "bg-layer-1-selected" : ""
          )}
          onClick={() => onChange(null)}
        >
          <Folder className="size-3.5 text-tertiary" />
          {t("file_library.folders.root")}
        </button>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={cn(
              "flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1 text-left text-12 hover:bg-layer-1-hover",
              value === option.id ? "bg-layer-1-selected" : ""
            )}
            style={{ paddingLeft: `${6 + option.depth * 14}px` }}
            onClick={() => onChange(option.id)}
          >
            <Folder className="size-3.5 text-tertiary" />
            <span className="truncate">{option.label}</span>
          </button>
        ))}
      </div>
      {allowCreate && (
        <Input
          value={newFolderName ?? ""}
          onChange={(e) => onNewFolderNameChange?.(e.target.value)}
          placeholder={t("file_library.folders.new_placeholder")}
          className="h-7 w-full text-12"
        />
      )}
    </div>
  );
});
