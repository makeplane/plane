/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// component
import { Outlet } from "react-router";
import useSWR from "swr";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/hooks/store";
// local components
import type { Route } from "./+types/layout";
import { WikiDetailsHeader } from "./header";

export default function WikiDetailsLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { fetchPagesList } = usePageStore(EPageStoreType.WORKSPACE);
  // fetching workspace pages list (feeds the breadcrumb page switcher)
  useSWR(`WORKSPACE_PAGES_${workspaceSlug}`, () => fetchPagesList(workspaceSlug));
  return (
    <>
      <AppHeader header={<WikiDetailsHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
