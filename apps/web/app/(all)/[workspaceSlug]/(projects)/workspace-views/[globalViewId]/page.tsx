"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { DEFAULT_GLOBAL_VIEWS_LIST } from "@plane/constants";
// components
import { PageHead } from "@/components/core/page-title";
import { AllIssueLayoutRoot } from "@/components/issues/issue-layouts/roots/all-issue-layout-root";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";

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
      <AllIssueLayoutRoot isDefaultView={!!defaultView} isLoading={isLoading} toggleLoading={toggleLoading} />
    </>
  );
});

export default GlobalViewIssuesPage;
