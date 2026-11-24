/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { TeamspacesOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useTeam } from "@/hooks/store/use-team";

type Props = {
  portfolioId: string | null | undefined;
};

/** Where a project sits in the team structure: team, then portfolio. */
export const ProjectStructurePath = observer(function ProjectStructurePath(props: Props) {
  const { portfolioId } = props;
  const { isEnabled, portfolioMap, teamMap } = useTeam();
  const { t } = useTranslation();
  const portfolio = portfolioId ? portfolioMap[portfolioId] : undefined;

  // an assigned portfolio that is not loaded yet must not be shown as missing
  if (!isEnabled || (portfolioId && !portfolio)) return null;

  const path = portfolio
    ? [teamMap[portfolio.team]?.name, portfolio.name].filter(Boolean).join(" / ")
    : t("team_structure.without_portfolio");

  return (
    <div className="flex items-center gap-1.5" title={path}>
      <TeamspacesOutline className="size-3.5 shrink-0 text-icon-tertiary" />
      <span className="truncate text-caption-md-regular text-tertiary">{path}</span>
    </div>
  );
});
