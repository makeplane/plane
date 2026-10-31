/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet, useParams } from "react-router";
import { DraftsOutline } from "@makeplane/propel/icons";
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { ReportsTabs } from "@/components/team-ops/reports";

export default function WorkReportsLayout() {
  const { workspaceSlug } = useParams();
  return (
    <>
      <AppHeader
        header={
          <Header>
            <Header.LeftItem>
              <Breadcrumbs>
                <Breadcrumbs.Item
                  component={
                    <BreadcrumbLink label="Work reports" icon={<DraftsOutline className="h-4 w-4 text-tertiary" />} />
                  }
                />
              </Breadcrumbs>
            </Header.LeftItem>
          </Header>
        }
      />
      <ContentWrapper>
        {workspaceSlug ? <ReportsTabs workspaceSlug={workspaceSlug} /> : null}
        <Outlet />
      </ContentWrapper>
    </>
  );
}
