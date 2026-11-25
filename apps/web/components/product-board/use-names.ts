/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import type { TBoardProduct } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useTeam } from "@/hooks/store/use-team";
import { useProductTypes } from "@/hooks/use-product-types";

/** Names of everything a product refers to. Must be used in an observer. */
export const useBoardNames = (workspaceSlug: string) => {
  const { t } = useTranslation();
  const { teamMap, portfolioMap } = useTeam();
  const { getUserDetails } = useMember();
  const { typeMap } = useProductTypes(workspaceSlug);

  return {
    team: (product: TBoardProduct) => teamMap[product.team_id]?.name ?? "",
    portfolio: (product: TBoardProduct) => (product.portfolio_id && portfolioMap[product.portfolio_id]?.name) || "",
    project: (product: TBoardProduct) => product.project_name ?? "",
    type: (product: TBoardProduct) => typeMap[product.product_type_id]?.name ?? "",
    typeOf: (product: TBoardProduct) => typeMap[product.product_type_id],
    owner: (product: TBoardProduct) => (product.owner_id && getUserDetails(product.owner_id)?.display_name) || "",
    /** Portfolio and project in one line. */
    path: (product: TBoardProduct) =>
      product.is_limited
        ? t("product_board.closed_project")
        : [portfolioMap[product.portfolio_id ?? ""]?.name, product.project_name].filter(Boolean).join(" / "),
  };
};
