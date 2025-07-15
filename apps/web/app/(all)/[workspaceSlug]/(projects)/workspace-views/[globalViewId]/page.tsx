"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { DEFAULT_GLOBAL_VIEWS_LIST } from "@plane/constants";
// components
import { PageHead } from "@/components/core";
import { AllIssueLayoutRoot, GlobalViewsAppliedFiltersRoot } from "@/components/issues";
// constants
// hooks
import { useWorkspace } from "@/hooks/store";

const GlobalViewIssuesPage = observer(() => {
  // router
  const { globalViewId } = useParams();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  // states
  const [isLoading, setIsLoading] = useState(false);

  // derived values
  const defaultView = DEFAULT_GLOBAL_VIEWS_LIST.find((view) => view.key === globalViewId);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - All Views` : undefined;

  // handlers
  const toggleLoading = (value: boolean) => setIsLoading(value);
  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full overflow-hidden bg-custom-background-100">
        <div className="flex h-full w-full flex-col border-b border-custom-border-300">
          {globalViewId && (
            <GlobalViewsAppliedFiltersRoot globalViewId={globalViewId.toString()} isLoading={isLoading} />
          )}
          <AllIssueLayoutRoot isDefaultView={!!defaultView} isLoading={isLoading} toggleLoading={toggleLoading} />
        </div>
      </div>
    </>
  );
});

export default GlobalViewIssuesPage;
