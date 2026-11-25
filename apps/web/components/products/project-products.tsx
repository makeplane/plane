/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useTeam } from "@/hooks/store/use-team";
import { useProductTypes } from "@/hooks/use-product-types";
// services
import { ProductService } from "@/services/product.service";
// local imports
import { ProductTypeBadge } from "./type-badge";

const productService = new ProductService();

type Props = {
  workspaceSlug: string | undefined;
  projectId: string;
  /** Icons without the names of the types. */
  isCompact?: boolean;
};

/** Which products a project has: a badge per type, the names of the products on hover. */
export const ProjectProducts = observer(function ProjectProducts(props: Props) {
  const { workspaceSlug, projectId, isCompact } = props;
  const { t } = useTranslation();
  const { isEnabled } = useTeam();
  const { productTypes } = useProductTypes(workspaceSlug);
  // one list of the workspace for all the projects on the page
  const { data } = useSWR(
    workspaceSlug && isEnabled ? ["PRODUCTS", workspaceSlug, undefined, undefined] : null,
    () => productService.list(workspaceSlug ?? "", {}),
    { revalidateOnFocus: false }
  );
  const products = useMemo(
    () => (data ?? []).filter((product) => product.project_id === projectId && product.state_group !== "cancelled"),
    [data, projectId]
  );

  if (!products.length) return null;

  return (
    <ul aria-label={t("product.products")} className="flex min-w-0 flex-wrap items-center gap-1">
      {productTypes.map((type) => {
        const names = products.filter((product) => product.product_type_id === type.id).map(({ name }) => name);
        if (!names.length) return null;
        return (
          <li key={type.id} className="max-w-full min-w-0">
            <ProductTypeBadge
              type={type}
              count={names.length}
              isCompact={isCompact}
              title={`${type.name}: ${names.join(", ")}`}
            />
          </li>
        );
      })}
    </ul>
  );
});
