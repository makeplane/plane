/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TNameDescriptionLoader } from "@plane/types";
import { EFileAssetType } from "@plane/types";
// components
import { PageHead } from "@/components/core/page-title";
import { DescriptionInput } from "@/components/editor/rich-text/description-input";
import { NameDescriptionUpdateStatus } from "@/components/issues/issue-update-status";
// hooks
import { useTeam } from "@/hooks/store/use-team";
import { useProductTypes } from "@/hooks/use-product-types";
// services
import { ProductService } from "@/services/product.service";
// local imports
import { getProductErrorKey } from "./helper";

const productService = new ProductService();

type Props = { workspaceSlug: string; productTypeId: string };

/** Requirements for one product type. Everyone but guests reads, workspace admins edit. */
export const ProductTypePage = observer(function ProductTypePage(props: Props) {
  const { workspaceSlug, productTypeId } = props;
  const [isSubmitting, setIsSubmitting] = useState<TNameDescriptionLoader>("saved");
  const { t } = useTranslation();
  const { isWorkspaceAdmin } = useTeam();
  const { typeMap, isLoading, mutate } = useProductTypes(workspaceSlug);
  const type = typeMap[productTypeId];

  if (isLoading) return null;
  if (!type) return <p className="text-body-sm-regular text-tertiary">{t("team_structure.not_found")}</p>;

  const isEmpty = !type.requirements_html || type.requirements_html === "<p></p>";

  return (
    <>
      <PageHead title={type.name} />
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-h3-medium text-primary">{type.name}</h3>
          {isWorkspaceAdmin && <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />}
        </div>
        <p className="text-body-sm-regular text-tertiary">{t("product.requirements")}</p>
        {!isWorkspaceAdmin && isEmpty ? (
          <p className="text-body-sm-regular text-tertiary">{t("product.no_requirements")}</p>
        ) : (
          <DescriptionInput
            key={type.id}
            containerClassName="min-h-40"
            disabled={!isWorkspaceAdmin}
            // uploads belong to work items, so there is no place for images here
            disabledExtensions={["image"]}
            entityId={type.id}
            fileAssetType={EFileAssetType.ISSUE_DESCRIPTION}
            initialValue={type.requirements_html}
            placeholder={t("product.requirements_placeholder")}
            setIsSubmitting={setIsSubmitting}
            workspaceSlug={workspaceSlug}
            onSubmit={async ({ description_html }) => {
              try {
                await productService.updateType(workspaceSlug, type.id, { requirements_html: description_html });
                await mutate();
              } catch (error) {
                setToast({ type: "error", title: t("toast.error"), message: t(getProductErrorKey(error)) });
              }
            }}
          />
        )}
      </div>
    </>
  );
});
