/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import useSWR from "swr";
// plane imports
import { DEFAULT_GLOBAL_VIEWS_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { SearchIcon } from "@plane/propel/icons";
import { Input } from "@plane/ui";
// components
import { PageHead } from "@/components/core/page-title";
import { ViewListLoader } from "@/components/ui/loader/view-list-loader";
import { GlobalDefaultViewListItem } from "@/components/workspace/views/default-view-list-item";
import { GlobalViewListItem } from "@/components/workspace/views/view-list-item";
// hooks
import { useGlobalView } from "@/hooks/store/use-global-view";
import { useWorkspace } from "@/hooks/store/use-workspace";

const WorkspaceViewsPage = observer(function WorkspaceViewsPage() {
  const [query, setQuery] = useState("");
  // router
  const navigate = useNavigate();
  const { workspaceSlug } = useParams();
  const [searchParams] = useSearchParams();
  // store
  const { currentWorkspace } = useWorkspace();
  const { globalViewMap, currentWorkspaceViews, fetchAllGlobalViews, getSearchedViews } = useGlobalView();
  const { t } = useTranslation();
  // fetch workspace views
  useSWR(
    workspaceSlug ? `GLOBAL_VIEWS_LIST_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchAllGlobalViews(workspaceSlug) : null
  );
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - All Views` : undefined;
  // Split views: default (Daily Status) first, rest after built-in views
  const filteredViewIds = getSearchedViews(query);
  const defaultViewIds = filteredViewIds?.filter((id) => globalViewMap[id]?.is_default) ?? [];
  const otherViewIds = filteredViewIds?.filter((id) => !globalViewMap[id]?.is_default) ?? [];

  // Auto-navigate to the default view on page load
  useEffect(() => {
    const viewId = searchParams.get("viewId");
    if (viewId || !workspaceSlug) return;
    if (!currentWorkspaceViews) return;

    const defaultViewId = currentWorkspaceViews.find(
      (id) => globalViewMap[id]?.is_default === true
    );

    if (defaultViewId) {
      void navigate(`/${workspaceSlug}/workspace-views/${defaultViewId}`, { replace: true });
    }
  }, [workspaceSlug, currentWorkspaceViews, globalViewMap, searchParams, navigate]);

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className="flex h-11 w-full items-center gap-2.5  px-5 py-3 overflow-hidden border-b border-subtle">
          <SearchIcon className="text-secondary" width={14} height={14} strokeWidth={2} />
          <Input
            className="w-full bg-transparent !p-0 text-11 leading-5 text-secondary placeholder:text-placeholder focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            mode="true-transparent"
          />
        </div>
        <div className="flex flex-col h-full w-full vertical-scrollbar scrollbar-lg">
          {/* Default workspace views (Daily Status) render first */}
          {!currentWorkspaceViews
            ? <ViewListLoader />
            : defaultViewIds.map((viewId) => <GlobalViewListItem key={viewId} viewId={viewId} />)
          }
          {/* Built-in views: All work items, Assigned, Created, Subscribed */}
          {DEFAULT_GLOBAL_VIEWS_LIST.filter((v) => t(v.i18n_label).toLowerCase().includes(query.toLowerCase())).map(
            (option) => (
              <GlobalDefaultViewListItem key={option.key} view={option} />
            )
          )}
          {/* Other workspace views */}
          {otherViewIds.map((viewId) => <GlobalViewListItem key={viewId} viewId={viewId} />)}
        </div>
      </div>
    </>
  );
});

export default WorkspaceViewsPage;
