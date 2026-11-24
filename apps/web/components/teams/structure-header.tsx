/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
import { TeamspacesOutline } from "@makeplane/propel/icons";
// plane imports
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useTeam } from "@/hooks/store/use-team";

/** Header of the team and portfolio pages. */
export const TeamStructureHeader = observer(function TeamStructureHeader() {
  const { workspaceSlug, teamId, portfolioId } = useParams();
  const { teamMap, portfolioMap } = useTeam();
  const portfolio = portfolioId ? portfolioMap[portfolioId] : undefined;
  const team = teamMap[portfolio?.team ?? teamId ?? ""];

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          {team && (
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={team.name}
                  href={portfolio ? `/${workspaceSlug}/teams/${team.id}` : undefined}
                  icon={<TeamspacesOutline className="size-4 text-tertiary" />}
                />
              }
            />
          )}
          {portfolio && <Breadcrumbs.Item component={<BreadcrumbLink label={portfolio.name} isLast />} />}
        </Breadcrumbs>
      </Header.LeftItem>
    </Header>
  );
});
