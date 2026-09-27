/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Search } from "lucide-react";
import type { TPage } from "@plane/types";
import { Button, EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { usePageCollectionStore } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  collectionId: string;
  pages: TPage[];
  currentPageIds: string[];
  onAdded?: () => Promise<void> | void;
};

export const AddExistingPageToCollectionModal = observer(function AddExistingPageToCollectionModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, collectionId, pages, currentPageIds, onAdded } = props;
  const { t } = useTranslation();
  const collectionStore = usePageCollectionStore();
  const [query, setQuery] = useState("");
  const [movingPageId, setMovingPageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentIds = useMemo(() => new Set(currentPageIds), [currentPageIds]);
  const candidates = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return pages
      .filter((page) => page.id && !page.deleted_at && !page.archived_at && !currentIds.has(page.id))
      .filter((page) => !normalized || (page.name || "Untitled").toLocaleLowerCase().includes(normalized))
      .toSorted((a, b) => (a.name || "Untitled").localeCompare(b.name || "Untitled"));
  }, [pages, currentIds, query]);

  const handleMove = async (pageId: string) => {
    if (movingPageId) return;
    setMovingPageId(pageId);
    setError(null);
    try {
      // Collection membership is exclusive. The backend intentionally moves
      // a page from its previous Collection when one exists.
      await collectionStore.movePageToCollection(workspaceSlug, collectionId, pageId);
      await onAdded?.();
      onClose();
    } catch (err: any) {
      setError(err?.error || err?.detail || t("wiki_collections.add_existing_page_modal.error_message"));
    } finally {
      setMovingPageId(null);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.TOP} width={EModalWidth.LG}>
      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-18 font-medium text-primary">{t("wiki_collections.menu.add_existing_page")}</h3>
          <p className="mt-1 text-13 text-secondary">
            A page can belong to only one collection. Choosing a page already in another collection moves it here.
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tertiary" />
          <Input
            value={query}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
            placeholder={t("wiki_collections.add_existing_page_modal.search_placeholder")}
            className="w-full pl-9"
          />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-md border border-subtle">
          {candidates.length === 0 ? (
            <div className="px-4 py-8 text-center text-13 text-secondary">{t("wiki_collections.add_existing_page_modal.no_pages_available")}</div>
          ) : (
            candidates.map((page) => (
              <button
                key={page.id}
                type="button"
                disabled={!!movingPageId}
                onClick={() => page.id && void handleMove(page.id)}
                className="flex w-full items-center justify-between gap-3 border-b border-subtle px-3 py-2.5 text-left text-13 last:border-b-0 hover:bg-layer-1 disabled:opacity-50"
              >
                <span className="min-w-0 flex-1 truncate text-primary">{page.name || "Untitled"}</span>
                <span className="flex-shrink-0 text-12 text-tertiary">
                  {movingPageId === page.id ? t("common.loading") : t("common.add")}
                </span>
              </button>
            ))
          )}
        </div>

        {error && <p className="text-12 text-danger-primary">{error}</p>}

        <div className="flex justify-end border-t border-subtle pt-4">
          <Button variant="outline-primary" size="lg" type="button" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
