import React, { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout-legacy";
// components
import { GlobalDefaultViewListItem, GlobalViewsList } from "components/workspace";
import { GlobalIssuesHeader } from "components/headers";
// ui
import { Input } from "@plane/ui";
// icons
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage } from "next";
// constants
import { DEFAULT_GLOBAL_VIEWS_LIST } from "constants/workspace";

const WorkspaceViews: NextPage = () => {
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { globalViews: globalViewsStore } = useMobxStore();

  useSWR(
    workspaceSlug ? `GLOBAL_VIEWS_LIST_${workspaceSlug.toString()}` : null,
    workspaceSlug ? () => globalViewsStore.fetchAllGlobalViews(workspaceSlug.toString()) : null
  );

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Workspace Views</span>
        </div>
      }
      right={<GlobalIssuesHeader activeLayout="list" />}
    >
      <div className="flex flex-col">
        <div className="h-full w-full flex flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 w-full px-5 py-3 border-b border-custom-border-200">
            <MagnifyingGlassIcon className="h-4 w-4 text-custom-text-200" />
            <Input
              className="w-full bg-transparent text-xs leading-5 text-custom-text-200 placeholder:text-custom-text-400 !p-0 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
            />
          </div>
        </div>
        {DEFAULT_GLOBAL_VIEWS_LIST.filter((v) => v.label.toLowerCase().includes(query.toLowerCase())).map((option) => (
          <GlobalDefaultViewListItem key={option.key} view={option} />
        ))}
        <GlobalViewsList searchQuery={query} />
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default WorkspaceViews;
