/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: header of the decision register page.

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
import { useTranslation } from "@plane/i18n";
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";
import { useProjectCrumbProps } from "@/components/breadcrumbs/use-project-crumb-props";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { useProject } from "@/hooks/store/use-project";
import { DecisionsIcon } from "./decisions-icon";

export const ProjectDecisionsHeader = observer(function ProjectDecisionsHeader() {
  const { workspaceSlug, projectId } = useParams();
  const { t } = useTranslation();
  const { loader } = useProject();
  const projectCrumb = useProjectCrumbProps(workspaceSlug?.toString(), projectId?.toString());

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
            {...projectCrumb}
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={t("liviere.decisions.title")}
                href={`/${workspaceSlug}/projects/${projectId}/decisions/`}
                icon={<DecisionsIcon className="h-4 w-4 text-tertiary" />}
                isLast
              />
            }
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
    </Header>
  );
});
