/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Select } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { TProductType } from "@plane/types";
// hooks
import { useProductTypes } from "@/hooks/use-product-types";

type Props = {
  workspaceSlug: string;
  value: string | null | undefined;
  onChange: (id: string) => void;
  variant?: "pill-md" | "select-md";
  disabled?: boolean;
};

/** Active product types, plus the current one when it has been disabled since. */
export const ProductTypeSelect = observer(function ProductTypeSelect(props: Props) {
  const { workspaceSlug, value, onChange, variant = "select-md", disabled } = props;
  const { t } = useTranslation();
  const { productTypes, typeMap } = useProductTypes(workspaceSlug);
  const options = productTypes.filter((type) => type.is_active || type.id === value);

  return (
    <Select<TProductType>
      getValues={() => options}
      value={(value && typeMap[value]) || null}
      onChange={(id) => onChange(String(id))}
      getOptionValue={(type) => type.id}
      getOptionLabel={(type) => type.name}
      placeholder={t("product.select_type")}
      pinSelected={false}
      disabled={disabled}
    >
      <Select.Trigger<TProductType> variant={variant}>
        {(selected) => <span className="truncate">{selected[0]?.name ?? t("product.select_type")}</span>}
      </Select.Trigger>
    </Select>
  );
});
