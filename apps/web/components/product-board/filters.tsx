/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { Switch } from "@makeplane/propel/components/switch";
// plane imports
import { Select } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { TBoardProduct } from "@plane/types";
// local imports
import { INDICATORS, LIST_FILTERS, STATE_GROUPS } from "./board";
import type { TBoardFilters, TListFilter } from "./board";
import { useBoardNames } from "./use-names";

type TOption = { id: string; name: string };

type Props = {
  workspaceSlug: string;
  /** All loaded products: they give the options. */
  products: TBoardProduct[];
  filters: TBoardFilters;
  isClosedShown: boolean;
  isOldShown: boolean;
  onChange: (changes: Record<string, string>) => void;
  onReset: () => void;
};

const inputClassName = "h-7 rounded-md border border-strong bg-layer-2 px-2 text-body-xs-regular text-primary";

export const BoardFilters = observer(function BoardFilters(props: Props) {
  const { workspaceSlug, products, filters, isClosedShown, isOldShown, onChange, onReset } = props;
  const { t } = useTranslation();
  const names = useBoardNames(workspaceSlug);

  const collect = (id: (product: TBoardProduct) => string | null, name: (product: TBoardProduct) => string) => {
    const options = new Map<string, string>();
    for (const product of products) {
      const key = id(product);
      if (key) options.set(key, name(product));
    }
    return sortBy(
      [...options].map(([key, value]) => ({ id: key, name: value })),
      (option) => option.name.toLowerCase()
    );
  };

  const options: Record<TListFilter, TOption[]> = {
    team: collect((product) => product.team_id, names.team),
    portfolio: collect((product) => product.portfolio_id, names.portfolio),
    project: collect((product) => product.project_id, names.project),
    type: collect((product) => product.product_type_id, names.type),
    status: STATE_GROUPS.map((id) => ({ id, name: t(`workspace_projects.state.${id}`) })),
    indicator: INDICATORS.map((id) => ({ id, name: t(`product.indicators.${id}`) })),
    owner: collect((product) => product.owner_id, names.owner),
  };
  const labels: Record<TListFilter, string> = {
    team: t("product_board.team"),
    portfolio: t("team_structure.portfolio"),
    project: t("common.project"),
    type: t("product.type"),
    status: t("common.state"),
    indicator: t("product.indicator"),
    owner: t("product.owner"),
  };
  const isFiltered =
    LIST_FILTERS.some((filter) => filters[filter].length) || filters.from || filters.to || isClosedShown || isOldShown;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {LIST_FILTERS.map((filter) => (
        <Select<TOption>
          key={filter}
          multiple
          getValues={() => options[filter]}
          value={options[filter].filter((option) => filters[filter].includes(option.id))}
          onChange={(ids) => onChange({ [filter]: ids.join() })}
          getOptionValue={(option) => option.id}
          getOptionLabel={(option) => option.name}
          placeholder={labels[filter]}
          pinSelected={false}
        >
          <Select.Trigger<TOption> variant="pill-md">
            {(selected) => (
              <span className="truncate">
                {labels[filter]}
                {selected.length > 0 && `: ${selected.length === 1 ? selected[0].name : selected.length}`}
              </span>
            )}
          </Select.Trigger>
        </Select>
      ))}
      <input
        type="date"
        aria-label={t("product_board.period_from")}
        className={inputClassName}
        value={filters.from}
        max={filters.to || undefined}
        onChange={(event) => onChange({ from: event.target.value })}
      />
      <span aria-hidden>–</span>
      <input
        type="date"
        aria-label={t("product_board.period_to")}
        className={inputClassName}
        value={filters.to}
        min={filters.from || undefined}
        onChange={(event) => onChange({ to: event.target.value })}
      />
      <label className="flex items-center gap-1.5 text-body-xs-regular text-secondary">
        <Switch
          size="sm"
          checked={isClosedShown}
          onCheckedChange={(isShown) => onChange({ closed: isShown ? "1" : "" })}
          aria-label={t("product_board.show_closed")}
        />
        {t("product_board.show_closed")}
      </label>
      <label className="flex items-center gap-1.5 text-body-xs-regular text-secondary">
        <Switch
          size="sm"
          checked={isOldShown}
          onCheckedChange={(isShown) => onChange({ old: isShown ? "1" : "" })}
          aria-label={t("product_board.show_old")}
        />
        {t("product_board.show_old")}
      </label>
      {isFiltered && (
        <Button variant="ghost" size="sm" stretch="auto" label={t("product_board.reset")} onClick={onReset} />
      )}
    </div>
  );
});
