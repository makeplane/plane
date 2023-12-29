import React, { useState, ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { GlobalDefaultViewListItem, GlobalViewsList } from "components/workspace";
import { GlobalIssuesHeader } from "components/headers";
// ui
import { Input } from "@plane/ui";
// icons
import { Search } from "lucide-react";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { DEFAULT_GLOBAL_VIEWS_LIST } from "constants/workspace";

const WorkspaceViewsPage: NextPageWithLayout = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="flex flex-col">
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="flex w-full items-center gap-2.5 border-b border-custom-border-200 px-5 py-3">
          <Search className="text-custom-text-200" size={14} strokeWidth={2} />
          <Input
            className="w-full bg-transparent !p-0 text-xs leading-5 text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            mode="true-transparent"
          />
        </div>
      </div>
      {DEFAULT_GLOBAL_VIEWS_LIST.filter((v) => v.label.toLowerCase().includes(query.toLowerCase())).map((option) => (
        <GlobalDefaultViewListItem key={option.key} view={option} />
      ))}
      <GlobalViewsList searchQuery={query} />
    </div>
  );
};

WorkspaceViewsPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<GlobalIssuesHeader activeLayout="list" />}>{page}</AppLayout>;
};

export default WorkspaceViewsPage;
