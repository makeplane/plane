/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ListTodo } from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Header } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";

export const JobsPrimaryHeader = observer(function JobsPrimaryHeader() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const base = `/${workspaceSlug}/projects/${projectId}/jobs`;

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug ?? ""} projectId={projectId ?? ""} />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={t("jobs.title")}
                href={base}
                icon={<ListTodo className="h-4 w-4 text-tertiary" />}
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
