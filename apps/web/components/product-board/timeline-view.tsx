/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TBoardProduct } from "@plane/types";
// components
import { ProductTypeBadge } from "@/components/products/type-badge";
// local imports
import { groupBy, summarize } from "./board";
import type { TGrouping, TScale } from "./board";
import type { TSave } from "./fields";
import { ProductTimeline } from "./timeline";
import { useBoardNames } from "./use-names";

type Props = {
  workspaceSlug: string;
  products: TBoardProduct[];
  scale: TScale;
  grouping: TGrouping;
  save: TSave;
  onOpen: (product: TBoardProduct) => void;
};

export const BoardTimelineView = observer(function BoardTimelineView(props: Props) {
  const { workspaceSlug, products, scale, grouping, save, onOpen } = props;
  const { t } = useTranslation();
  const names = useBoardNames(workspaceSlug);

  const groupKey = (product: TBoardProduct) => {
    const parts = [product.team_id];
    if (grouping !== "team") parts.push(product.portfolio_id ?? "");
    if (grouping === "project") parts.push(product.project_id ?? "");
    return parts.join();
  };
  const groupName = (product: TBoardProduct) => {
    const parts = [names.team(product)];
    if (product.is_limited && grouping !== "team") parts.push(t("product_board.closed_project"));
    else {
      if (grouping !== "team") parts.push(names.portfolio(product));
      if (grouping === "project") parts.push(names.project(product));
    }
    return parts.join(" / ");
  };

  const groups = [...groupBy(products, groupKey)].map(([id, items]) => {
    const summary = summarize(items);
    return {
      id,
      name: groupName(items[0]),
      summary: (
        <span className="flex gap-3 text-caption-md-regular text-tertiary">
          {(["total", "in_progress", "at_risk", "overdue"] as const).map((key) => (
            <span key={key}>
              {key === "at_risk" ? t("product.indicators.at_risk") : t(`product.summary.${key}`)}: {summary[key]}
            </span>
          ))}
        </span>
      ),
      items,
    };
  });

  return (
    <ProductTimeline
      groups={groups}
      scale={scale}
      onOpen={onOpen}
      canEdit={(product) => product.can_edit}
      onMove={(product, edge, date) => void save(product, { [edge]: date })}
      renderLabel={(product) => (
        <button type="button" onClick={() => onOpen(product)} className="w-full min-w-0 space-y-1 text-left">
          <span className="block truncate text-body-xs-medium text-primary">{product.name}</span>
          <span className="flex min-w-0 items-center gap-2">
            <ProductTypeBadge type={names.typeOf(product)} className="shrink-0" />
            <span className="truncate text-caption-sm-regular text-tertiary">{names.path(product)}</span>
          </span>
        </button>
      )}
    />
  );
});
