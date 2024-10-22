"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// hooks
import { useInstance, useUser, useWorkspace } from "@/hooks/store";
// silo contexts
import { ImporterBaseContextProvider } from "@/plane-web/silo/contexts/base-importer";
// silo hooks
import { useApiServiceToken } from "@/plane-web/silo/hooks";

type TImporterLayout = {
  children: ReactNode;
};

const ImporterLayout: FC<TImporterLayout> = observer((props) => {
  const { children } = props;
  const { workspaceSlug: workspaceSlugParam } = useParams();
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { data: currentUser } = useUser();
  const { config } = useInstance();
  // derived values
  const siloBaseUrl = config?.silo_base_url;
  const workspaceSlug = workspaceSlugParam?.toString() || undefined;

  // check if workspace exists
  if (!workspaceSlug || !currentWorkspace || !currentWorkspace?.id || !currentUser?.id || !siloBaseUrl) return null;

  const { data: serviceToken, isLoading: serviceTokenLoading } = useApiServiceToken(workspaceSlug);

  if (serviceTokenLoading) {
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">service-token Loader...</div>
    );
  }

  if (!serviceToken) {
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        service-token Something went wrong
      </div>
    );
  }

  return (
    <ImporterBaseContextProvider
      workspaceSlug={workspaceSlug}
      workspaceId={currentWorkspace?.id}
      userId={currentUser?.id}
      userEmail={currentUser?.email}
      siloBaseUrl={siloBaseUrl}
      apiBaseUrl={API_BASE_URL}
      serviceToken={serviceToken}
    >
      {children}
    </ImporterBaseContextProvider>
  );
});

export default ImporterLayout;
