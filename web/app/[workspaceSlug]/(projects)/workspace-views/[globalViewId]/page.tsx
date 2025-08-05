"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { AllIssueLayoutRoot, GlobalViewsAppliedFiltersRoot } from "@/components/issues";
import { GlobalViewsHeader } from "@/components/workspace";
// constants
import { DEFAULT_GLOBAL_VIEWS_LIST } from "@/constants/workspace";
// hooks
import { useWorkspace } from "@/hooks/store";
import { useTranslation } from "@plane/i18n";

const GlobalViewIssuesPage = observer(() => {
  // router
  const { globalViewId } = useParams();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  // derived values
  const defaultView = DEFAULT_GLOBAL_VIEWS_LIST.find((view) => view.key === globalViewId);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - All ${t("views")}` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full overflow-hidden bg-custom-background-100">
        <div className="flex h-full w-full flex-col border-b border-custom-border-300">
          <GlobalViewsHeader />
          {globalViewId && <GlobalViewsAppliedFiltersRoot globalViewId={globalViewId.toString()} />}
          <AllIssueLayoutRoot isDefaultView={!!defaultView} />
        </div>
      </div>
    </>
  );
});

export default GlobalViewIssuesPage;
