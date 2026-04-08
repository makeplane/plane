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

import { useState } from "react";
import { observer } from "mobx-react";
import { FilePlus, FolderPlus } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { PlusIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TPage } from "@plane/types";
import { EPageAccess } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { useAppRouter } from "@/hooks/use-app-router";
import { useCollection, EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

type TCollectionAddPageMenuProps = {
  workspaceSlug: string;
  targetCollectionId?: string;
  showAddExisting: boolean;
  onOpenAddExisting?: () => void;
  buttonType: "header" | "icon";
};

export const CollectionAddPageMenu = observer(function CollectionAddPageMenu(props: TCollectionAddPageMenuProps) {
  const { workspaceSlug, targetCollectionId, showAddExisting, onOpenAddExisting, buttonType } = props;
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const router = useAppRouter();
  const collectionStore = useCollection();
  const { t } = useTranslation();
  const { createPage } = usePageStore(EPageStoreType.WORKSPACE);

  const handleCreatePage = async () => {
    if (!workspaceSlug || isCreatingPage) return;

    try {
      setIsCreatingPage(true);

      const page = await createPage({
        access: EPageAccess.PUBLIC,
      } as Partial<TPage>);

      if (!page?.id) return;

      if (targetCollectionId) {
        await collectionStore.addPageToCollection(workspaceSlug, page.id, targetCollectionId);
        collectionStore.setCollectionExpanded(targetCollectionId);
      }

      router.push(`/${workspaceSlug}/wiki/${page.id}`);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message:
          (error as { detail?: string; error?: string })?.detail ??
          (error as { error?: string })?.error ??
          t("wiki_collections.toasts.create_page_in_collection_error"),
      });
    } finally {
      setIsCreatingPage(false);
    }
  };

  return (
    <CustomMenu
      customButton={
        buttonType === "header" ? (
          <Button variant="primary" size="base" disabled={isCreatingPage} loading={isCreatingPage}>
            {t("wiki_collections.header.add_page")}
          </Button>
        ) : (
          <button
            type="button"
            className="grid size-4 place-items-center rounded-md text-tertiary transition-all hover:bg-layer-transparent-hover hover:text-primary disabled:opacity-50"
            aria-label={t("wiki_collections.header.add_page")}
            disabled={isCreatingPage}
          >
            <PlusIcon className="size-3" />
          </button>
        )
      }
      placement="bottom-end"
      closeOnSelect
    >
      <CustomMenu.MenuItem onClick={() => void handleCreatePage()} disabled={isCreatingPage}>
        <div className="flex items-center gap-2">
          <FilePlus className="size-3.5" />
          {t("wiki_collections.menu.create_new_page")}
        </div>
      </CustomMenu.MenuItem>
      {showAddExisting && onOpenAddExisting && (
        <CustomMenu.MenuItem onClick={onOpenAddExisting}>
          <div className="flex items-center gap-2">
            <FolderPlus className="size-3.5" />
            {t("wiki_collections.menu.add_existing_page")}
          </div>
        </CustomMenu.MenuItem>
      )}
    </CustomMenu>
  );
});
