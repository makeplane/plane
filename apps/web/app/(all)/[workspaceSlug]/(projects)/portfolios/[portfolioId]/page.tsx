/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { PortfolioCard } from "@/components/teams/portfolio-card";
// hooks
import { useTeam } from "@/hooks/store/use-team";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import type { Route } from "./+types/page";

function WorkspacePortfolioPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, portfolioId } = params;
  const { portfolioMap } = useTeam();
  const { t } = useTranslation();
  const router = useAppRouter();
  const portfolio = portfolioMap[portfolioId];

  if (!portfolio) return <p className="text-body-sm-regular text-tertiary">{t("team_structure.not_found")}</p>;

  return (
    <>
      <PageHead title={portfolio.name} />
      <PortfolioCard
        workspaceSlug={workspaceSlug}
        portfolio={portfolio}
        isLinked={false}
        onDeleted={() => router.push(`/${workspaceSlug}/teams/${portfolio.team}`)}
      />
    </>
  );
}

export default observer(WorkspacePortfolioPage);
