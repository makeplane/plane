"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// component
import { PageHead } from "@/components/core";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// store hooks
import { useUser, useWorkspace } from "@/hooks/store";
// plane web components
import { SubscriptionActivation } from "@/plane-web/components/workspace";
// plane web hooks
import { useSelfHostedSubscription } from "@/plane-web/hooks/store";

const ActivationPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { licenseActivationByWorkspaceSlug } = useSelfHostedSubscription();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Activation` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  if (!workspaceSlug || !currentWorkspace?.id) return <></>;

  if (!isAdmin || licenseActivationByWorkspaceSlug())
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  return (
    <div className="container mx-auto pr-10">
      <PageHead title={pageTitle} />
      <SubscriptionActivation workspaceSlug={workspaceSlug.toString()} />
    </div>
  );
});

export default ActivationPage;
