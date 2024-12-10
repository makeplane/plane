"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { ImportersEmptyState } from "@/components/importers";
// hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
import { useUserProfile } from "@/hooks/store/use-user-profile";
// plane web components
import { ImportersList } from "@/plane-web/components/importers";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store";
import { E_FEATURE_FLAGS } from "@/plane-web/types/feature-flag";

const ImportsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUserProfile } = useUserProfile();
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Imports` : undefined;
  const importersEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.SILO_IMPORTERS);

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  if (!importersEnabled)
    return (
      <>
        <PageHead title={pageTitle} />
        <ImportersEmptyState theme={currentUserProfile?.theme.theme || "light"} />
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
