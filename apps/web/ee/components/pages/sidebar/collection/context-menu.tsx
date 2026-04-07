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
import type { MouseEvent } from "react";
import { observer } from "mobx-react";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { LinkIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TCollection, TLogoProps } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { DeleteCollectionModal, RenameCollectionModal } from "@/components/collections";
import { useCollection } from "@/plane-web/hooks/store";

type Props = {
  collection: TCollection;
  workspaceSlug: string;
};

export const CollectionContextMenu = observer(function CollectionContextMenu({ collection, workspaceSlug }: Props) {
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const collectionStore = useCollection();
  const { t } = useTranslation();
  const collectionInstance = collectionStore.getCollectionById(collection.id);

  const handleCopyLink = () => {
    const collectionUrl = `${window.location.origin}/${workspaceSlug}/wiki/collections/${collection.id}`;
    void navigator.clipboard.writeText(collectionUrl).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.link_copied"),
        message: t("wiki_collections.toasts.collection_link_copied"),
      });
      return undefined;
    });
  };

  return (
    <>
      <RenameCollectionModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        collectionId={collection.id}
        collectionName={collection.name}
        logoProps={collection.logo_props as TLogoProps}
      />

      <DeleteCollectionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        workspaceSlug={workspaceSlug}
        collectionId={collection.id}
        collectionName={collection.name}
      />

      <CustomMenu
        customButton={
          <button
            type="button"
            className="grid place-items-center size-5 rounded-md hover:bg-layer-transparent-hover text-tertiary hover:text-primary transition-all"
            aria-label={t("wiki_collections.menu.collection_options")}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        }
        placement="bottom-end"
        closeOnSelect
        openOnHover={false}
        portalElement={typeof document !== "undefined" ? document.body : null}
        menuButtonOnClick={(event: MouseEvent) => {
          event.stopPropagation();
        }}
      >
        {collectionInstance?.canCurrentUserEditCollection && (
          <CustomMenu.MenuItem onClick={() => setIsRenameModalOpen(true)}>
            <div className="flex items-center gap-2 font-body-sm font-regular">
              <Edit className="size-3" />
              {t("wiki_collections.menu.rename_collection")}
            </div>
          </CustomMenu.MenuItem>
        )}
        <CustomMenu.MenuItem onClick={handleCopyLink}>
          <div className="flex items-center gap-2 font-body-sm font-regular">
            <LinkIcon className="size-3" />
            {t("common.actions.copy_link")}
          </div>
        </CustomMenu.MenuItem>

        {collectionInstance?.canCurrentUserDeleteCollection && (
          <>
            <hr className="my-1 border-subtle-1" />
            <CustomMenu.MenuItem onClick={() => setIsDeleteModalOpen(true)}>
              <div className="flex items-center gap-2 text-danger-primary font-body-sm font-regular">
                <Trash2 className="size-3" />
                {t("common.actions.delete")}
              </div>
            </CustomMenu.MenuItem>
          </>
        )}
      </CustomMenu>
    </>
  );
});
