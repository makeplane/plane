/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "react-router";
import { Button } from "@makeplane/propel/components/button";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
// hooks
import { useTeam } from "@/hooks/store/use-team";
// local imports
import { LIST_FILTERS, SCALES, matches } from "./board";
import type { TBoardFilters, TGrouping, TScale } from "./board";
import { BoardFilters } from "./filters";
import { BoardKanbanView } from "./kanban-view";
import { BoardPanel } from "./panel";
import { BoardTableView } from "./table-view";
import { BoardTimelineView } from "./timeline-view";
import { useBoard } from "./use-board";

const VIEWS = ["timeline", "table", "kanban"] as const;
const GROUPINGS: TGrouping[] = ["team", "portfolio", "project"];

const pick = <T extends string>(value: string | null, options: readonly T[]): T =>
  options.find((option) => option === value) ?? options[0];

type SwitchProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T;
  getLabel: (option: T) => string;
  onChange: (option: T) => void;
};

function OptionSwitch<T extends string>(props: SwitchProps<T>) {
  const { label, options, value, getLabel, onChange } = props;
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      {options.map((option) => (
        <Button
          key={option}
          size="sm"
          stretch="auto"
          variant={option === value ? "secondary" : "ghost"}
          aria-pressed={option === value}
          label={getLabel(option)}
          onClick={() => onChange(option)}
        />
      ))}
    </div>
  );
}

type BoardProps = {
  workspaceSlug: string;
  /** Part of a page with a title and paddings of its own. */
  isEmbedded?: boolean;
};

const Board = observer(function Board({ workspaceSlug, isEmbedded = false }: BoardProps) {
  const [params, setParams] = useSearchParams();
  const { t } = useTranslation();
  // derived values
  const view = pick(params.get("view"), VIEWS);
  const scale = pick<TScale>(params.get("scale"), ["month", ...SCALES]);
  const grouping = pick(params.get("group"), GROUPINGS);
  const isClosedShown = params.get("closed") === "1";
  const isOldShown = params.get("old") === "1";
  const filters = useMemo(() => {
    const lists = Object.fromEntries(
      LIST_FILTERS.map((filter) => [filter, params.get(filter)?.split(",").filter(Boolean) ?? []])
    );
    return { ...lists, from: params.get("from") ?? "", to: params.get("to") ?? "" } as TBoardFilters;
  }, [params]);
  const { products, error, states, save } = useBoard(workspaceSlug, {
    include_closed: isClosedShown,
    include_old: isOldShown,
  });

  const update = (changes: Record<string, string>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true }
    );

  const reset = () =>
    update(Object.fromEntries([...LIST_FILTERS, "from", "to", "closed", "old"].map((key) => [key, ""])));

  if (error?.response?.status === 403) return <NotAuthorizedView />;
  if (error && !products)
    return <p className="p-6 text-body-sm-regular text-tertiary">{t("something_went_wrong_please_try_again")}</p>;
  if (!products)
    return (
      <div className="grid size-full place-items-center">
        <LogoSpinner />
      </div>
    );

  const shown = products.filter((product) => matches(product, filters));
  const common = {
    workspaceSlug,
    products: shown,
    save,
    onOpen: (product: { id: string }) => update({ product: product.id }),
  };

  return (
    <div className={cn("flex size-full flex-col gap-3 overflow-hidden", { "px-page-x py-4": !isEmbedded })}>
      {!isEmbedded && <PageHead title={t("product_board.title")} />}
      <BoardPanel
        workspaceSlug={workspaceSlug}
        product={products.find((product) => product.id === params.get("product"))}
        states={states}
        save={save}
        onClose={() => update({ product: "" })}
      />
      <div className="flex flex-wrap items-center gap-4">
        <OptionSwitch
          label={t("product_board.view")}
          options={VIEWS}
          value={view}
          getLabel={(option) => t(`product_board.views.${option}`)}
          onChange={(option) => update({ view: option })}
        />
        {view === "timeline" && (
          <>
            <OptionSwitch
              label={t("product_board.scale")}
              options={SCALES}
              value={scale}
              getLabel={(option) => t(`product_board.scales.${option}`)}
              onChange={(option) => update({ scale: option })}
            />
            <OptionSwitch
              label={t("common.group_by")}
              options={GROUPINGS}
              value={grouping}
              getLabel={(option) =>
                option === "team"
                  ? t("product_board.team")
                  : t(option === "portfolio" ? "team_structure.portfolio" : "common.project")
              }
              onChange={(option) => update({ group: option })}
            />
          </>
        )}
        <span role="status" className="ml-auto text-caption-md-regular text-tertiary">
          {t("product_board.shown", { shown: shown.length, total: products.length })}
        </span>
      </div>
      <BoardFilters
        workspaceSlug={workspaceSlug}
        products={products}
        filters={filters}
        isClosedShown={isClosedShown}
        isOldShown={isOldShown}
        onChange={update}
        onReset={reset}
      />
      <div className="min-h-0 grow">
        {shown.length === 0 ? (
          <p className="text-body-sm-regular text-tertiary">{t("product.no_products")}</p>
        ) : view === "timeline" ? (
          <BoardTimelineView {...common} scale={scale} grouping={grouping} />
        ) : view === "table" ? (
          <BoardTableView {...common} states={states} />
        ) : (
          <BoardKanbanView {...common} states={states} />
        )}
      </div>
    </div>
  );
});

/** Products of all teams for the management team and workspace admins. */
export const ProductBoardRoot = observer(function ProductBoardRoot(props: BoardProps) {
  const { canSeeProductBoard } = useTeam();
  if (!canSeeProductBoard) return <NotAuthorizedView />;
  return <Board {...props} />;
});
