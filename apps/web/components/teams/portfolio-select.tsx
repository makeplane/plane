/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Select } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { TPortfolio } from "@plane/types";
// hooks
import { useTeam } from "@/hooks/store/use-team";

type Props = {
  value: string | null | undefined;
  onChange: (portfolioId: string) => void;
  /** Offer only these portfolios. Defaults to every portfolio the user manages. */
  portfolios?: TPortfolio[];
  variant?: "pill-md" | "select-md";
  disabled?: boolean;
  tabIndex?: number;
};

/** Portfolio picker grouped by team. */
export const PortfolioSelect = observer(function PortfolioSelect(props: Props) {
  const { value, onChange, portfolios, variant = "select-md", disabled, tabIndex } = props;
  const { t } = useTranslation();
  const { manageablePortfolios, portfolioMap, teamMap } = useTeam();
  const options = portfolios ?? manageablePortfolios;

  return (
    <Select<TPortfolio>
      getValues={() => options}
      value={(value && portfolioMap[value]) || null}
      onChange={onChange}
      getOptionValue={(portfolio) => portfolio.id}
      getOptionLabel={(portfolio) => portfolio.name}
      getOptionGroup={(portfolio) => teamMap[portfolio.team]?.name}
      placeholder={t("team_structure.select_portfolio")}
      emptyMessage={t("team_structure.no_portfolios")}
      pinSelected={false}
      disabled={disabled}
    >
      <Select.Trigger<TPortfolio> variant={variant} tabIndex={tabIndex}>
        {(selected) => (
          <span className="truncate">
            {selected[0]
              ? `${teamMap[selected[0].team]?.name ?? ""} / ${selected[0].name}`
              : t("team_structure.select_portfolio")}
          </span>
        )}
      </Select.Trigger>
    </Select>
  );
});
