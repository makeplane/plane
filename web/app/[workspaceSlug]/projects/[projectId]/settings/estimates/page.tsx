"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core";
import { EstimatesList } from "@/components/estimates";
// constants
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useUser, useProject } from "@/hooks/store";

const EstimatesSettingsPage = observer(() => {
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();
  // derived values
  const isAdmin = currentProjectRole === EUserProjectRoles.ADMIN;
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Estimates` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className={`w-full overflow-y-auto py-8 pr-9  ${isAdmin ? "" : "pointer-events-none opacity-60"}`}>
        <EstimatesList />
      </div>
    </>
  );
});

export default EstimatesSettingsPage;
