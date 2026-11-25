/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TProductListItem } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// components
import { DataTable } from "@/components/common/data-table";
import { ProductTimeline } from "@/components/product-board/timeline";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useAppRouter } from "@/hooks/use-app-router";
import { useProductTypes } from "@/hooks/use-product-types";
// services
import { ProductService } from "@/services/product.service";
// local imports
import { ProductIndicatorBadge } from "./indicator-badge";
import { ProductTypeBadge } from "./type-badge";

const productService = new ProductService();

/** Products of the projects the user is a member of. */
export const useProductList = (workspaceSlug: string, params: { team_id?: string; portfolio_id?: string }) =>
  useSWR(["PRODUCTS", workspaceSlug, params.team_id, params.portfolio_id], () =>
    productService.list(workspaceSlug, params)
  );

type Props = { workspaceSlug: string; teamId: string };

export const TeamProductList = observer(function TeamProductList(props: Props) {
  const { workspaceSlug, teamId } = props;
  const { t } = useTranslation();
  const router = useAppRouter();
  const { getUserDetails } = useMember();
  const { typeMap } = useProductTypes(workspaceSlug);
  const { data, isLoading } = useProductList(workspaceSlug, { team_id: teamId });

  if (!isLoading && !data?.length)
    return <p className="text-body-sm-regular text-tertiary">{t("product.no_products")}</p>;

  const columns = [
    {
      key: "name",
      content: t("name"),
      tdRender: (product: TProductListItem) => (
        <Link
          href={`/${workspaceSlug}/browse/${product.project_identifier}-${product.sequence_id}/`}
          className="text-accent-primary hover:underline"
        >
          {product.name}
        </Link>
      ),
    },
    {
      key: "type",
      content: t("product.type"),
      tdRender: (product: TProductListItem) => <ProductTypeBadge type={typeMap[product.product_type_id]} />,
    },
    {
      key: "owner",
      content: t("product.owner"),
      tdRender: (product: TProductListItem) =>
        product.owner_id ? (getUserDetails(product.owner_id)?.display_name ?? "") : "",
    },
    {
      key: "dates",
      content: t("product.dates"),
      tdRender: (product: TProductListItem) =>
        `${renderFormattedDate(product.start_date) ?? ""} – ${renderFormattedDate(product.target_date) ?? ""}`,
    },
    { key: "state", content: t("common.state"), tdRender: (product: TProductListItem) => product.state_name },
    {
      key: "progress",
      content: t("product.progress"),
      tdRender: (product: TProductListItem) => (product.progress === null ? "—" : `${product.progress}%`),
    },
    {
      key: "indicator",
      content: t("product.indicator"),
      tdRender: (product: TProductListItem) => <ProductIndicatorBadge indicator={product.indicator} />,
    },
  ];

  return (
    <div className="space-y-4">
      {!!data?.length && (
        <ProductTimeline
          groups={[{ id: teamId, name: "", items: data }]}
          scale="month"
          isFlat
          className="max-h-96"
          onOpen={(product) =>
            router.push(`/${workspaceSlug}/browse/${product.project_identifier}-${product.sequence_id}/`)
          }
          renderLabel={(product) => (
            <span className="min-w-0 space-y-1">
              <span className="block truncate text-body-xs-medium text-primary">{product.name}</span>
              <ProductTypeBadge type={typeMap[product.product_type_id]} />
            </span>
          )}
        />
      )}
      <DataTable columns={columns} data={data ?? []} keyExtractor={(product) => product.id} isLoading={isLoading} />
    </div>
  );
});

/** Total, in progress, overdue and completed products of a portfolio. */
export function PortfolioProductSummary({
  workspaceSlug,
  portfolioId,
}: {
  workspaceSlug: string;
  portfolioId: string;
}) {
  const { t } = useTranslation();
  const { data } = useProductList(workspaceSlug, { portfolio_id: portfolioId });
  if (!data?.length) return null;

  const items = [
    ["total", data.length],
    ["in_progress", data.filter((product) => product.state_group === "started").length],
    ["overdue", data.filter((product) => product.indicator === "overdue").length],
    ["completed", data.filter((product) => product.indicator === "completed").length],
  ] as const;

  return (
    <dl aria-label={t("product.products")} className="flex flex-wrap gap-4 text-body-xs-regular text-tertiary">
      <div className="text-secondary">{t("product.products")}</div>
      {items.map(([key, value]) => (
        <div key={key} className="flex gap-1">
          <dt>{t(`product.summary.${key}`)}:</dt>
          <dd className="text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
