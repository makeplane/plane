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
import type { MouseEvent, ReactNode } from "react";
import { observer } from "mobx-react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { LinkIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TCollection, TLogoProps } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { DeleteCollectionModal, EditCollectionModal } from "@/components/collections";
import { useCollection } from "@/plane-web/hooks/store";

type Props = {
  collection: TCollection;
  workspaceSlug: string;
  customButton?: ReactNode;
};

export const CollectionContextMenu = observer(function CollectionContextMenu({
  collection,
  workspaceSlug,
  customButton,
}: Props) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
      <EditCollectionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
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
          customButton ?? (
            <IconButton
              variant="ghost"
              size="sm"
              icon={MoreHorizontal}
              aria-label={t("wiki_collections.menu.collection_options")}
            />
          )
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
          <CustomMenu.MenuItem onClick={() => setIsEditModalOpen(true)}>
            <div className="flex items-center gap-2 font-body-sm font-regular">
              <Pencil className="size-3" />
              {t("common.actions.edit")}
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
