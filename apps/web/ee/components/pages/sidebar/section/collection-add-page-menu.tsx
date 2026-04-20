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
import { FilePlus, FolderPlus, Loader } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { ChevronDownIcon, PlusIcon } from "@plane/propel/icons";
import { getIconButtonStyling } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/propel/utils";
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

        if (collectionStore.isCollectionPagesLoaded(targetCollectionId)) {
          void collectionStore.fetchCollectionPages(workspaceSlug, targetCollectionId, {
            force: true,
          });
        }
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

  const menuItems = (
    <>
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
    </>
  );

  if (buttonType === "header") {
    return (
      <div className="flex h-7 w-[106px] items-center gap-px">
        <Button
          variant="primary"
          size="base"
          className="!h-7 !w-[77px] !rounded-[6px_2px_2px_6px] !px-0 !text-[13px] !font-normal !leading-none"
          disabled={isCreatingPage}
          onClick={() => void handleCreatePage()}
        >
          {isCreatingPage ? t("common.adding") : t("wiki_collections.header.add_page")}
        </Button>
        <CustomMenu
          customButton={<ChevronDownIcon className="size-3.5" />}
          customButtonClassName={cn(getIconButtonStyling("primary", "base"), "!size-7 !rounded-[2px_6px_6px_2px]")}
          placement="bottom-end"
          disabled={isCreatingPage}
          ariaLabel={t("wiki_collections.header.add_page")}
          closeOnSelect
        >
          {menuItems}
        </CustomMenu>
      </div>
    );
  }

  return (
    <CustomMenu
      customButton={isCreatingPage ? <Loader className="size-3.5 animate-spin" /> : <PlusIcon className="size-3.5" />}
      customButtonClassName={getIconButtonStyling("ghost", "sm")}
      placement="bottom-end"
      disabled={isCreatingPage}
      ariaLabel={t("wiki_collections.header.add_page")}
      closeOnSelect
    >
      {menuItems}
    </CustomMenu>
  );
});
