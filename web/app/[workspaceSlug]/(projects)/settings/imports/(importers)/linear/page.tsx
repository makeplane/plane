"use client";

import { FC, Fragment, useState } from "react";
import { E_IMPORTER_KEYS } from "@silo/core";
// silo contexts
import { ImporterSyncJobContextProvider } from "@/plane-web/silo/contexts";
// silo hooks
import { useSyncConfig } from "@/plane-web/silo/hooks";
// silo components
import { UserAuthentication, Dashboard, StepsRoot } from "@/plane-web/silo/linear/components";
// silo context
import { ImporterContextProvider } from "@/plane-web/silo/linear/contexts";

const LinearImporter: FC = () => {
  // hooks
  const { data, isLoading } = useSyncConfig(E_IMPORTER_KEYS.LINEAR);
  // states
  const [isDashboardView, setIsDashboardView] = useState<boolean>(true);

  if (isLoading)
    return <div className="text-custom-text-200 relative flex justify-center items-center">linear-auth Loading...</div>;

  if (!data)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        linear-auth Something went wrong
      </div>
    );

  return (
    <ImporterSyncJobContextProvider importerType={E_IMPORTER_KEYS.LINEAR}>
      <ImporterContextProvider setDashboardView={setIsDashboardView}>
        {!data?.isAuthenticated ? (
          <UserAuthentication />
        ) : (
          <Fragment>{isDashboardView ? <Dashboard setIsDashboardView={setIsDashboardView} /> : <StepsRoot />}</Fragment>
        )}
      </ImporterContextProvider>
    </ImporterSyncJobContextProvider>
  );
};

export default LinearImporter;
