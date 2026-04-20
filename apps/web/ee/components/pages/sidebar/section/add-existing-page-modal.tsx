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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Combobox } from "@headlessui/react";
import useSWR from "swr";
import { FileText, Loader2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { CloseIcon, SearchIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TCollectionAddablePage } from "@plane/types";
import { Checkbox, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
import useDebounce from "@/hooks/use-debounce";
import { useCollection } from "@/plane-web/hooks/store";

type TAddExistingPageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  workspaceSlug: string;
  onSuccess?: () => void;
};

const ADDABLE_PAGES_SWR_OPTIONS = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
} as const;

export const AddExistingPageModal = observer(function AddExistingPageModal(props: TAddExistingPageModalProps) {
  const { isOpen, onClose, collectionId, workspaceSlug, onSuccess } = props;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPages, setSelectedPages] = useState<TCollectionAddablePage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const collectionStore = useCollection();
  const { t } = useTranslation();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setSelectedPages([]);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const normalizedSearchTerm = debouncedSearchTerm.trim();
  const addablePagesKey = isOpen
    ? ["collection-addable-pages", workspaceSlug, collectionId, normalizedSearchTerm]
    : null;
  const { data: searchResults = [], isLoading: isSearching } = useSWR(
    addablePagesKey,
    addablePagesKey
      ? () =>
          collectionStore.searchAddablePages(workspaceSlug, collectionId, {
            search: normalizedSearchTerm || undefined,
          })
      : null,
    ADDABLE_PAGES_SWR_OPTIONS
  );

  const handleSubmit = async () => {
    if (!workspaceSlug || selectedPages.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await collectionStore.addPagesToCollection(
        workspaceSlug,
        selectedPages.map((page) => page.id).filter((pageId): pageId is string => !!pageId),
        collectionId
      );

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("wiki_collections.add_existing_page_modal.success_message", { count: selectedPages.length }),
      });
      onSuccess?.();
      onClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: t("wiki_collections.add_existing_page_modal.error_message"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} width={EModalWidth.LG} position={EModalPosition.TOP} handleClose={handleClose}>
      {/* @ts-expect-error Headless UI v1 types do not support multiple + by with object values */}
      <Combobox as="div" multiple value={selectedPages} onChange={setSelectedPages} by="id">
        <div className="flex items-center gap-2 border-b border-subtle px-4">
          <SearchIcon className="size-4 flex-shrink-0 text-placeholder" aria-hidden="true" />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent text-13 text-primary outline-none placeholder:text-placeholder focus:ring-0"
            placeholder={t("wiki_collections.add_existing_page_modal.search_placeholder")}
            displayValue={() => ""}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {selectedPages.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-2">
            {selectedPages.map((page) => {
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() =>
                    setSelectedPages((currentPages) => currentPages.filter((currentPage) => currentPage.id !== page.id))
                  }
                  className="group flex items-center gap-1.5 rounded-sm border border-transparent bg-layer-2 px-2 py-1 transition-all hover:border-subtle"
                >
                  {page.logo_props?.in_use ? (
                    <Logo logo={page.logo_props} size={14} type="lucide" />
                  ) : (
                    <FileText className="size-3.5 text-tertiary" />
                  )}
                  <p className="truncate text-11 text-tertiary transition-colors group-hover:text-secondary">
                    {page.name || t("wiki_collections.list.untitled")}
                  </p>
                  <CloseIcon className="size-3 flex-shrink-0 text-placeholder transition-colors group-hover:text-secondary" />
                </button>
              );
            })}
          </div>
        )}

        <Combobox.Options
          static
          className="vertical-scrollbar max-h-80 overflow-y-auto scroll-py-2 px-2 pb-2 pt-2 scrollbar-md"
        >
          {isSearching ? (
            <div className="flex items-center justify-center px-3 py-12 text-13 text-tertiary">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-3 py-12 text-center text-13 text-tertiary">
              {searchTerm
                ? t("wiki_collections.add_existing_page_modal.no_pages_found")
                : t("wiki_collections.add_existing_page_modal.no_pages_available")}
            </div>
          ) : (
            <ul className="text-primary">
              {searchResults.map((page) => {
                const isSelected = selectedPages.some((selectedPage) => selectedPage.id === page.id);

                return (
                  <Combobox.Option
                    key={page.id}
                    value={page}
                    className={({ active }) =>
                      cn(
                        "flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded-md p-2 text-secondary transition-colors",
                        {
                          "bg-layer-transparent-hover": active,
                          "text-primary": isSelected,
                        }
                      )
                    }
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="flex flex-shrink-0 items-center gap-2.5">
                        <Checkbox checked={isSelected} />
                        {page.logo_props?.in_use ? (
                          <Logo logo={page.logo_props} size={16} type="lucide" />
                        ) : (
                          <FileText className="size-4 text-secondary" />
                        )}
                      </span>
                      <p className="truncate text-13">{page.name || t("wiki_collections.list.untitled")}</p>
                    </div>
                  </Combobox.Option>
                );
              })}
            </ul>
          )}
        </Combobox.Options>
      </Combobox>

      <div className="flex items-center justify-end gap-2 border-t border-subtle p-3">
        <Button variant="secondary" size="lg" onClick={handleClose} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => void handleSubmit()}
          loading={isSubmitting}
          disabled={selectedPages.length === 0}
        >
          {t("wiki_collections.add_existing_page_modal.submit")}
        </Button>
      </div>
    </ModalCore>
  );
});
