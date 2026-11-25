/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Button } from "@makeplane/propel/components/button";
import { Switch } from "@makeplane/propel/components/switch";
// plane imports
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TProductType } from "@plane/types";
// components
import { DataTable } from "@/components/common/data-table";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useProductTypes } from "@/hooks/use-product-types";
// services
import { ProductService } from "@/services/product.service";
// local imports
import { getProductErrorKey } from "./helper";
import { ProductTypeBadge } from "./type-badge";
import { ProductTypeFormDialog } from "./type-form-dialog";

const productService = new ProductService();

export const ProductTypesSettingsRoot = observer(function ProductTypesSettingsRoot(props: { workspaceSlug: string }) {
  const { workspaceSlug } = props;
  // states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [edited, setEdited] = useState<TProductType | undefined>(undefined);
  const [deleted, setDeleted] = useState<TProductType | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  // hooks
  const { t } = useTranslation();
  const { productTypes, isLoading, mutate } = useProductTypes(workspaceSlug);

  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    try {
      await action();
      await mutate();
      return true;
    } catch (error) {
      setToast({ type: "error", title: t("toast.error"), message: t(getProductErrorKey(error)) });
      return false;
    }
  };

  const openForm = (type?: TProductType) => {
    setEdited(type);
    setIsFormOpen(true);
  };

  /** Moves a type one row, halfway between its new neighbours. */
  const move = (type: TProductType, step: 1 | -1) => {
    const index = productTypes.findIndex(({ id }) => id === type.id);
    const near = productTypes[index + step];
    if (!near) return;
    const far = productTypes[index + 2 * step];
    const sort_order = far ? (near.sort_order + far.sort_order) / 2 : near.sort_order + step * 10000;
    void run(() => productService.updateType(workspaceSlug, type.id, { sort_order }));
  };

  const handleDelete = async () => {
    if (!deleted) return;
    setIsDeleting(true);
    await run(() => productService.removeType(workspaceSlug, deleted.id));
    setIsDeleting(false);
    setDeleted(undefined);
  };

  const columns = [
    {
      key: "name",
      content: t("name"),
      tdRender: (type: TProductType) => <ProductTypeBadge type={type} />,
    },
    {
      key: "active",
      content: t("product.active"),
      tdRender: (type: TProductType) => (
        <Switch
          size="sm"
          checked={type.is_active}
          aria-label={`${t("product.active")}: ${type.name}`}
          onCheckedChange={(is_active) =>
            void run(() => productService.updateType(workspaceSlug, type.id, { is_active }))
          }
        />
      ),
    },
    {
      key: "requirements",
      content: t("product.requirements"),
      tdRender: (type: TProductType) => (
        <Link href={`/${workspaceSlug}/product-types/${type.id}`} className="text-accent-primary hover:underline">
          {t("product.open_requirements")}
        </Link>
      ),
    },
    {
      key: "actions",
      content: "",
      tdRender: (type: TProductType) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            stretch="auto"
            label="↑"
            aria-label={t("product.move_up")}
            disabled={productTypes[0]?.id === type.id}
            onClick={() => move(type, -1)}
          />
          <Button
            variant="ghost"
            size="sm"
            stretch="auto"
            label="↓"
            aria-label={t("product.move_down")}
            disabled={productTypes.at(-1)?.id === type.id}
            onClick={() => move(type, 1)}
          />
          <Button variant="ghost" size="sm" stretch="auto" label={t("edit")} onClick={() => openForm(type)} />
          <Button variant="ghost" size="sm" stretch="auto" label={t("delete")} onClick={() => setDeleted(type)} />
        </div>
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-y-8">
      <ProductTypeFormDialog
        isOpen={isFormOpen}
        type={edited}
        onClose={() => setIsFormOpen(false)}
        onSubmit={(values) =>
          run(() =>
            edited
              ? productService.updateType(workspaceSlug, edited.id, values)
              : productService.createType(workspaceSlug, values)
          )
        }
      />
      <ConfirmDialog
        isOpen={!!deleted}
        isSubmitting={isDeleting}
        title={t("product.delete_type.title")}
        content={t("product.delete_type.description", { name: deleted?.name ?? "" })}
        handleClose={() => setDeleted(undefined)}
        handleSubmit={handleDelete}
      />
      <SettingsHeading
        title={t("product.types")}
        description={t("product.types_description")}
        control={
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={t("product.create_type")}
            onClick={() => openForm()}
          />
        }
      />
      <DataTable columns={columns} data={productTypes} keyExtractor={(type) => type.id} isLoading={isLoading} />
    </div>
  );
});
