"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { PageHead } from "@/components/core";
// hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { ImportersList } from "@/plane-web/components/importers";
// plane web hooks

const ImportsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Imports` : undefined;

  if (!isAdmin)
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
      <section className="w-full overflow-y-auto">
        <div className="flex items-center border-b border-custom-border-100 pb-3.5">
          <h3 className="text-xl font-medium">Imports</h3>
        </div>
        {workspaceSlug && <ImportersList workspaceSlug={workspaceSlug.toString()} />}
      </section>
    </>
  );
});

export default ImportsPage;
