"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core";
import ExportGuide from "@/components/exporter/guide";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useUser, useWorkspace } from "@/hooks/store";

const ExportsPage = observer(() => {
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();

  // derived values
  const hasPageAccess =
    currentWorkspaceRole && [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER].includes(currentWorkspaceRole);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Exports` : undefined;

  if (!hasPageAccess)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="w-full overflow-y-auto md:pr-9 pr-4">
        <div className="flex items-center border-b border-custom-border-100 py-3.5">
          <h3 className="text-xl font-medium">Exports</h3>
        </div>
        <ExportGuide />
      </div>
    </>
  );
});

export default ExportsPage;