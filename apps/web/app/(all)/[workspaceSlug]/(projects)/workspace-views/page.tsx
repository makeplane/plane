import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { DEFAULT_GLOBAL_VIEWS_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { SearchIcon } from "@plane/propel/icons";
import { Input } from "@plane/ui";
// components
import { PageHead } from "@/components/core/page-title";
import { GlobalDefaultViewListItem } from "@/components/workspace/views/default-view-list-item";
import { GlobalViewsList } from "@/components/workspace/views/views-list";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";

function WorkspaceViewsPage() {
  const [query, setQuery] = useState("");
  // store
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - All Views` : undefined;

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
          {DEFAULT_GLOBAL_VIEWS_LIST.filter((v) => t(v.i18n_label).toLowerCase().includes(query.toLowerCase())).map(
            (option) => (
              <GlobalDefaultViewListItem key={option.key} view={option} />
            )
          )}
          <GlobalViewsList searchQuery={query} />
        </div>
      </div>
    </>
  );
}

export default observer(WorkspaceViewsPage);
