/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TBoardProduct, TBoardState } from "@plane/types";
// components
import { ProductIndicatorBadge } from "@/components/products/indicator-badge";
import { ProductTypeBadge } from "@/components/products/type-badge";
import { DataTable } from "@/components/common/data-table";
// local imports
import { INDICATORS, STATE_GROUPS } from "./board";
import { BoardCommentField, BoardDateField, BoardProgressField, BoardStateField } from "./fields";
import type { TSave } from "./fields";
import { useBoardNames } from "./use-names";

type Props = {
  workspaceSlug: string;
  products: TBoardProduct[];
  states: Record<string, TBoardState[]>;
  save: TSave;
  onOpen: (product: TBoardProduct) => void;
};

// Hundreds of rows with their controls take seconds to draw.
const ROWS_STEP = 50;

type TColumn =
  | "team"
  | "portfolio"
  | "project"
  | "name"
  | "type"
  | "owner"
  | "start_date"
  | "target_date"
  | "state"
  | "comment"
  | "progress"
  | "manual"
  | "indicator";

export const BoardTableView = observer(function BoardTableView(props: Props) {
  const { workspaceSlug, products, states, save, onOpen } = props;
  const [sort, setSort] = useState<{ column: TColumn; isDescending: boolean }>({
    column: "target_date",
    isDescending: false,
  });
  const [limit, setLimit] = useState(ROWS_STEP);
  const { t, currentLocale } = useTranslation();
  const names = useBoardNames(workspaceSlug);

  const sortValue = (product: TBoardProduct, column: TColumn): string | number => {
    switch (column) {
      case "name":
        return product.name;
      case "start_date":
      case "target_date":
        return product[column] ?? "";
      case "state":
        return STATE_GROUPS.indexOf(product.state_group);
      case "comment":
        return product.status_comment ?? "";
      case "progress":
        return product.progress ?? -1;
      case "manual":
        return product.manual_progress ?? -1;
      case "indicator":
        return INDICATORS.indexOf(product.indicator);
      default:
        return names[column](product);
    }
  };

  // oxlint-disable-next-line unicorn/no-array-sort -- a copy is sorted, toSorted is not in the target library
  const sorted = [...products].sort((a, b) => {
    const [first, second] = [sortValue(a, sort.column), sortValue(b, sort.column)];
    const order =
      typeof first === "number" && typeof second === "number"
        ? first - second
        : String(first).localeCompare(String(second), currentLocale);
    return sort.isDescending ? -order : order;
  });

  const labels: Record<TColumn, string> = {
    team: t("product_board.team"),
    portfolio: t("team_structure.portfolio"),
    project: t("common.project"),
    name: t("product.kinds.product"),
    type: t("product.type"),
    owner: t("product.owner"),
    start_date: t("start_date"),
    target_date: t("due_date"),
    state: t("common.state"),
    comment: t("product.status_comment"),
    progress: t("product.progress"),
    manual: t("product.manual_progress"),
    indicator: t("product.indicator"),
  };

  const render: Record<TColumn, (product: TBoardProduct) => React.ReactNode> = {
    team: names.team,
    portfolio: names.portfolio,
    project: (product) => (product.is_limited ? t("product_board.closed_project") : names.project(product)),
    name: (product) => (
      <button type="button" onClick={() => onOpen(product)} className="text-left text-accent-primary hover:underline">
        {product.name}
      </button>
    ),
    type: (product) => <ProductTypeBadge type={names.typeOf(product)} />,
    owner: names.owner,
    start_date: (product) => <BoardDateField product={product} save={save} field="start_date" />,
    target_date: (product) => <BoardDateField product={product} save={save} field="target_date" />,
    state: (product) => <BoardStateField product={product} save={save} states={states[product.project_id ?? ""]} />,
    comment: (product) => <BoardCommentField product={product} save={save} />,
    progress: (product) => (product.progress === null ? "—" : `${product.progress}%`),
    manual: (product) => <BoardProgressField product={product} save={save} className="min-w-16" />,
    indicator: (product) => <ProductIndicatorBadge indicator={product.indicator} />,
  };

  const columns = (Object.keys(labels) as TColumn[]).map((column) => ({
    key: column,
    content: labels[column],
    thRender: () => (
      <button
        type="button"
        className="flex items-center gap-1 whitespace-nowrap"
        onClick={() =>
          setSort((current) => ({ column, isDescending: current.column === column && !current.isDescending }))
        }
      >
        {labels[column]}
        {sort.column === column && <span aria-hidden>{sort.isDescending ? "↓" : "↑"}</span>}
      </button>
    ),
    tdRender: render[column],
  }));

  return (
    <div className="h-full overflow-auto">
      <DataTable columns={columns} data={sorted.slice(0, limit)} keyExtractor={(product) => product.id} />
      {sorted.length > limit && (
        <Button
          variant="ghost"
          size="sm"
          stretch="auto"
          label={`${t("common.load_more")} (${sorted.length - limit})`}
          onClick={() => setLimit((current) => current + ROWS_STEP)}
        />
      )}
    </div>
  );
});
