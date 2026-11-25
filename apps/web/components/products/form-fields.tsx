/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TProductPayload } from "@plane/types";
// components
import { MemberSelect } from "@/components/dropdowns/member/member-select";
// local imports
import { ProductRequirementsLink } from "./requirements-link";
import { ProductTypeSelect } from "./type-select";

type Props = {
  workspaceSlug: string;
  projectId: string | null;
  value: TProductPayload;
  onChange: (value: TProductPayload) => void;
  variant: "pill-md" | "select-md";
};

/** Type and owner, the fields a new product needs besides its dates. */
export const ProductFormFields = observer(function ProductFormFields(props: Props) {
  const { workspaceSlug, projectId, value, onChange, variant } = props;
  const { t } = useTranslation();

  return (
    <>
      <ProductTypeSelect
        workspaceSlug={workspaceSlug}
        value={value.product_type_id}
        onChange={(product_type_id) => onChange({ ...value, product_type_id })}
        variant={variant}
      />
      <MemberSelect
        projectId={projectId ?? undefined}
        value={value.owner_id}
        onChange={(owner_id) => onChange({ ...value, owner_id })}
        placeholder={t("product.owner")}
        variant={variant}
      />
      {value.product_type_id && (
        <ProductRequirementsLink workspaceSlug={workspaceSlug} productTypeId={value.product_type_id} />
      )}
    </>
  );
});
