/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import useSWR from "swr";
// hooks
import { useTeam } from "@/hooks/store/use-team";
// services
import { ProductService } from "@/services/product.service";

const productService = new ProductService();

/** Product types of the workspace, shared between everything that shows them. */
export const useProductTypes = (workspaceSlug: string | undefined) => {
  const { isEnabled } = useTeam();
  const { data, isLoading, mutate } = useSWR(
    workspaceSlug && isEnabled ? `PRODUCT_TYPES_${workspaceSlug}` : null,
    () => productService.listTypes(workspaceSlug ?? ""),
    { revalidateOnFocus: false }
  );
  const typeMap = useMemo(() => Object.fromEntries((data ?? []).map((type) => [type.id, type])), [data]);

  return { productTypes: data ?? [], typeMap, isLoading, mutate };
};
