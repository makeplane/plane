/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";

// plane imports
import { useTranslation } from "@plane/i18n";
import { AddOutline, LoadingOutline } from "@makeplane/propel/icons";
import { setToast } from "../../toast";
import { cn } from "@plane/utils";
// local imports
import { useSelectContext } from "../../select";
import type { LabelOption } from "./label-select";

type CreateLabelEmptyStateProps = {
  /** Trimmed search query — doubles as the name of the label to create. */
  query: string;
  /** Whether the current user is allowed to create labels here. */
  canCreate: boolean;
  onCreateLabel?: (name: string) => Promise<LabelOption>;
  /** Fired with the newly created label's id once creation succeeds. */
  onCreated: (id: string) => void;
};

/**
 * Empty state for `LabelSelect`'s search: a plain "no matching labels" message, or — when the
 * caller can create labels — a "+ Add "<query>" to labels" row that creates and selects one.
 */
export function CreateLabelEmptyState({ query, canCreate, onCreateLabel, onCreated }: CreateLabelEmptyStateProps) {
  // states
  const [isCreating, setIsCreating] = useState(false);
  // translation
  const { t } = useTranslation();
  // select context
  const { close } = useSelectContext();

  const handleCreate = useCallback(async () => {
    if (isCreating || !onCreateLabel) return;
    try {
      setIsCreating(true);
      const created = await onCreateLabel(query);
      onCreated(created.id);
      close();
    } catch (error) {
      const err = error as { name?: string[]; error?: string };
      const message = err?.name?.includes("LABEL_NAME_ALREADY_EXISTS")
        ? t("label.create.already_exists")
        : (err?.error ?? t("failed_to_create_label"));
      setToast({ type: "error", title: t("error"), message });
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, onCreateLabel, query, onCreated, close, t]);

  useEffect(() => {
    if (!canCreate || !onCreateLabel || isCreating) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
      void handleCreate();
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [canCreate, onCreateLabel, handleCreate, isCreating, query]);

  if (!canCreate || !onCreateLabel) {
    return <div className="px-2 py-1.5 text-body-xs-regular text-secondary">{t("no_matching_labels")}</div>;
  }

  const ButtonIcon = isCreating ? LoadingOutline : AddOutline;

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-body-xs-regular text-secondary hover:bg-layer-transparent-hover"
      onClick={() => void handleCreate()}
      disabled={isCreating}
    >
      <ButtonIcon
        className={cn("size-3.5 shrink-0", {
          "animate-spin": isCreating,
        })}
      />
      <span className="truncate">
        {isCreating ? t("adding_label", { name: query }) : t("add_label_to_labels", { name: query })}
      </span>
    </button>
  );
}
