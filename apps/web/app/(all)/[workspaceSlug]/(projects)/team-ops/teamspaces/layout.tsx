/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { MembersOutline } from "@makeplane/propel/icons";
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";

export default function TeamspacesLayout() {
  return (
    <>
      <AppHeader
        header={
          <Header>
            <Header.LeftItem>
              <Breadcrumbs>
                <Breadcrumbs.Item
                  component={
                    <BreadcrumbLink label="Teamspaces" icon={<MembersOutline className="h-4 w-4 text-tertiary" />} />
                  }
                />
              </Breadcrumbs>
            </Header.LeftItem>
          </Header>
        }
      />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
