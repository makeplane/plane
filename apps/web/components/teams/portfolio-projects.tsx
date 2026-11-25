/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { Logo } from "@plane/blocks/emoji-icon-picker";
import { useTranslation } from "@plane/i18n";
// components
import { ProjectProducts } from "@/components/products/project-products";
import { ProjectNetworkIcon } from "@/components/project/project-network-icon";
// hooks
import { useTeam } from "@/hooks/store/use-team";

type Props = {
  workspaceSlug: string;
  portfolioId: string;
};

/** Projects of a portfolio the user can see. */
export const PortfolioProjects = observer(function PortfolioProjects(props: Props) {
  const { workspaceSlug, portfolioId } = props;
  const { getPortfolioProjects } = useTeam();
  const { t } = useTranslation();
  const projects = getPortfolioProjects(portfolioId);

  if (projects.length === 0)
    return <p className="text-body-xs-regular text-tertiary">{t("team_structure.no_projects")}</p>;

  return (
    <ul className="divide-y divide-subtle">
      {projects.map((project) => (
        <li key={project.id} className="flex flex-wrap items-center justify-between gap-x-4">
          <Link
            href={`/${workspaceSlug}/projects/${project.id}/issues`}
            className="flex min-w-0 items-center gap-2 py-2 text-body-sm-regular text-primary hover:text-accent-primary"
          >
            <Logo logo={project.logo_props} size={16} />
            <span className="truncate">{project.name}</span>
            <span className="text-body-xs-regular text-tertiary">{project.identifier}</span>
            {project.network === 0 && <ProjectNetworkIcon iconKey="Lock" />}
          </Link>
          <ProjectProducts workspaceSlug={workspaceSlug} projectId={project.id} />
        </li>
      ))}
    </ul>
  );
});
