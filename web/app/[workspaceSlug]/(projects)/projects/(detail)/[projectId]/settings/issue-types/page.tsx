"use client";

import { observer } from "mobx-react";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// hooks
import { useProject, useUser } from "@/hooks/store";
import { IssueTypesRoot } from "@/plane-web/components/issue-types";

const IssueTypesSettingsPage = observer(() => {
  // store hooks
  const {
    canPerformProjectAdminActions,
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Issue Types` : undefined;

  if (currentProjectRole && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div className={`w-full h-full overflow-hidden py-8 pr-4`}>
        <IssueTypesRoot />
      </div>
    </>
  );
});

export default IssueTypesSettingsPage;
