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

import { memo } from "react";
import { BookOpen } from "lucide-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { TCollection, TLogoProps } from "@plane/types";
import { cn } from "@plane/utils";
import { useAppRouter } from "@/hooks/use-app-router";
import { CollectionContextMenu } from "../collection";
import { BaseCollectionItem } from "./base-collection-item";
import { CollectionAddPageMenu } from "./collection-add-page-menu";

type TCollectionItemProps = {
  collection: TCollection;
  workspaceSlug: string;
  isCollectionActive: boolean;
  onOpenAddExistingPage: (collectionId: string) => void;
};

const CollectionItemContent = function CollectionItemContent(props: TCollectionItemProps) {
  const { collection, workspaceSlug, isCollectionActive, onOpenAddExistingPage } = props;
  const router = useAppRouter();
  const collectionLogoProps = collection.logo_props as TLogoProps | undefined;
  const iconColor =
    collectionLogoProps?.in_use === "icon"
      ? (collectionLogoProps.icon?.background_color ?? collectionLogoProps.icon?.color)
      : undefined;

  return (
    <BaseCollectionItem
      collectionId={collection.id}
      workspaceSlug={workspaceSlug}
      isCollectionActive={isCollectionActive}
      label={collection.name}
      onClick={() => router.push(`/${workspaceSlug}/wiki/collections/${collection.id}`)}
      icon={
        <span
          className={cn("grid size-5 shrink-0 place-items-center rounded-md", {
            "bg-layer-1": !iconColor,
          })}
          style={{ backgroundColor: iconColor ? `${iconColor}20` : undefined }}
        >
          {collectionLogoProps?.in_use ? (
            <Logo logo={collectionLogoProps} size={14} type="lucide" />
          ) : (
            <BookOpen className="size-3.5" />
          )}
        </span>
      }
      actions={
        <>
          <CollectionAddPageMenu
            workspaceSlug={workspaceSlug}
            targetCollectionId={collection.id}
            showAddExisting
            onOpenAddExisting={() => onOpenAddExistingPage(collection.id)}
            buttonType="icon"
          />
          <CollectionContextMenu collection={collection} workspaceSlug={workspaceSlug} />
        </>
      }
    />
  );
};

export const CollectionItem = memo(CollectionItemContent);
