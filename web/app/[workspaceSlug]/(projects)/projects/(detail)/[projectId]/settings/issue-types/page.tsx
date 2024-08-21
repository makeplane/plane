"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core";
// hooks
import { EUserProjectRoles } from "@/constants/project";
import { useProject, useUser } from "@/hooks/store";
import { IssueTypesRoot } from "@/plane-web/components/issue-types";

const IssueTypesSettingsPage = observer(() => {
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();
  // derived values
  const isAdmin = currentProjectRole === EUserProjectRoles.ADMIN;
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Issue Types` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className={`w-full h-full overflow-hidden py-8 pr-4 ${isAdmin ? "" : "pointer-events-none opacity-60"}`}>
        <IssueTypesRoot />
      </div>
    </>
  );
});

export default IssueTypesSettingsPage;
