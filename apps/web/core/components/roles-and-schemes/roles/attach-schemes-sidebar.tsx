/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { ArrowRightIcon, SearchIcon, CloseIcon } from "@plane/propel/icons";
import { Checkbox } from "@plane/ui";
import { cn } from "@plane/utils";
import type { PermissionNamespace } from "@plane/types";
// hooks
import { usePermissionScheme } from "@/hooks/store/use-permission-scheme";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  namespace: PermissionNamespace;
  attachedSchemeIds: string[];
  onSave: (schemeIds: string[]) => Promise<void>;
};

export const AttachSchemesSidebar = observer(function AttachSchemesSidebar(props: Props) {
  const { isOpen, onClose, workspaceSlug, namespace, attachedSchemeIds, onSave } = props;
  // state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(attachedSchemeIds));
  const [isSubmitting, setIsSubmitting] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getSchemesByNamespace } = usePermissionScheme();
  // derived values
  const allSchemes = getSchemesByNamespace(workspaceSlug, namespace);

  const filteredSchemes = useMemo(
    () =>
      searchQuery
        ? allSchemes.filter((scheme) => scheme.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : allSchemes,
    [allSchemes, searchQuery]
  );

  // Sync internal state when attachedSchemeIds changes (e.g., after save)
  useEffect(() => {
    setSelectedIds(new Set(attachedSchemeIds));
  }, [attachedSchemeIds]);

  const hasChanges = useMemo(() => {
    const attachedSet = new Set(attachedSchemeIds);
    if (selectedIds.size !== attachedSet.size) return true;
    for (const id of selectedIds) {
      if (!attachedSet.has(id)) return true;
    }
    return false;
  }, [selectedIds, attachedSchemeIds]);

  // handlers
  const handleToggle = useCallback((schemeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(schemeId)) {
        next.delete(schemeId);
      } else {
        next.add(schemeId);
      }
      return next;
    });
  }, []);

  const handleDiscard = useCallback(() => {
    setSelectedIds(new Set(attachedSchemeIds));
    setSearchQuery("");
  }, [attachedSchemeIds]);

  const handleClose = useCallback(() => {
    handleDiscard();
    onClose();
  }, [handleDiscard, onClose]);

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    try {
      setIsSubmitting(true);
      await onSave([...selectedIds]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [hasChanges, selectedIds, onSave, onClose]);

  return (
    <aside
      className={cn(
        "shrink-0 h-full w-[320px] -mr-[320px] flex min-h-0 flex-col bg-surface-1 border-l border-subtle transition-all",
        { "mr-0": isOpen }
      )}
    >
      {/* Header */}
      <div className="shrink-0 px-4 pt-4">
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center justify-center text-secondary hover:text-primary transition-colors"
          aria-label="Close sidebar"
        >
          <ArrowRightIcon className="size-4" />
        </button>
        <h4 className="mt-4 text-h5-medium text-primary">
          {t("workspace_settings.settings.roles_and_schemes.attach_schemes.title")}
        </h4>
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 pt-3 pb-3">
        <div className="relative flex items-center">
          <SearchIcon
            className={cn("pointer-events-none absolute left-3 size-4 shrink-0 text-tertiary", {
              "text-primary": searchQuery,
            })}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("workspace_settings.settings.roles_and_schemes.attach_schemes.search_placeholder")}
            className="w-full h-7 rounded-lg border border-subtle bg-surface-1 pl-9 pr-8 text-body-sm-regular placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-strong"
          />
          {searchQuery && (
            <IconButton
              variant="ghost"
              className="absolute right-2 text-secondary hover:text-primary"
              onClick={() => setSearchQuery("")}
              icon={CloseIcon}
            />
          )}
        </div>
      </div>

      {/* Scheme list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredSchemes.length > 0 ? (
          <div className="space-y-2">
            {filteredSchemes.map((scheme) => {
              const isSelected = selectedIds.has(scheme.id);

              return (
                <button
                  key={scheme.id}
                  type="button"
                  onClick={() => handleToggle(scheme.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-subtle bg-layer-2 px-3 py-3 text-left transition-colors hover:bg-layer-2-hover"
                >
                  <Checkbox checked={isSelected} containerClassName="shrink-0" />
                  <span className="flex-1 truncate text-body-sm-regular text-primary">{scheme.name}</span>
                  <span className="shrink-0 rounded-sm bg-layer-3 px-1.5 h-5 inline-flex items-center text-caption-sm-medium text-tertiary">
                    {scheme.permissions.length} permission{scheme.permissions.length !== 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-body-sm-regular text-tertiary">
            {searchQuery
              ? t("workspace_settings.settings.roles_and_schemes.attach_schemes.no_schemes_found")
              : t("workspace_settings.settings.roles_and_schemes.attach_schemes.no_schemes_found")}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-start gap-3 border-t border-subtle px-4 py-3">
        <Button onClick={handleSave} disabled={!hasChanges} loading={isSubmitting}>
          {t("workspace_settings.settings.roles_and_schemes.attach_schemes.add")}
        </Button>
        <Button variant="secondary" onClick={handleDiscard}>
          {t("workspace_settings.settings.roles_and_schemes.attach_schemes.discard")}
        </Button>
      </div>
    </aside>
  );
});
