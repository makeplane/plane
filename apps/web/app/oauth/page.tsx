/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { PlaneLockup } from "@plane/propel/icons";
// components
import { PageHead } from "@/components/core/page-title";
import { EmailSettingsLoader } from "@/components/ui/loader/settings/email";
import { AppConsent } from "@/components/marketplace";
import { redirectIfUserIsNotOnboarded, requireAuthenticatedUser } from "@/lib/middleware/auth-client-middleware";
// constants
import { APPLICATION_BY_CLIENT_ID } from "@/constants/fetch-keys";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// assets
import { ApplicationService } from "@/services/marketplace";

const applicationService = new ApplicationService();

export const clientMiddleware = [requireAuthenticatedUser, redirectIfUserIsNotOnboarded];

function OAuthPage() {
  const searchParams = useSearchParams();
  const {
    workspace_slug,
    client_id,
    redirect_uri,
    code_challenge,
    code_challenge_method,
    response_type,
    nonce,
    state,
    claims,
    disable_dropdown,
  } = Object.fromEntries(searchParams.entries());

  const { data, isLoading } = useSWR(client_id ? APPLICATION_BY_CLIENT_ID(client_id) : null, async () => {
    const application = await applicationService.getApplicationByClientId(client_id);
    if (!application?.id) return { application, applicationPermissions: null };

    const applicationPermissions = await applicationService.getApplicationPermissions(application.id.toString());
    return { application, applicationPermissions };
  });

  const application = data?.application;
  const applicationPermissions = data?.applicationPermissions?.reduce((acc, curr) => {
    acc[curr.workspace_id] = curr.state;
    return acc;
  }, {} as any);

  const workspaceAppInstallations = data?.applicationPermissions?.reduce((acc: any, curr: any) => {
    acc[curr.workspace_id] = curr.is_installed;
    return acc;
  }, {} as any);

  if (isLoading) {
    return <EmailSettingsLoader />;
  }

  if (!application || !client_id || !redirect_uri) {
    return (
      <DefaultLayout>
        <div className="flex flex-col justify-center items-center space-y-4 flex-grow container h-[100vh-60px] mx-auto max-w-2xl px-10 lg:max-w-2xl lg:px-5 transition-all mt-10">
          <PlaneLockup className="h-12 w-auto text-primary" />
          <h1 className="text-20 font-bold">Something went wrong</h1>
          <p className="text-13 text-gray-500">Please check the URL and try again.</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="relative w-screen h-screen overflow-hidden">
        <PageHead title={"OAuth | Plane"} />
        <div className="relative z-10 w-screen h-screen overflow-hidden overflow-y-auto flex flex-col">
          <div className="container min-w-full px-5 lg:px-10 py-5 lg:py-5 flex-shrink-0 relative flex justify-start pb-4 transition-all border-b border-subtle">
            <Link href={`/`}>
              <PlaneLockup className="h-7 w-auto text-primary" />
            </Link>
          </div>
          <div className="flex flex-col justify-center flex-grow container h-[100vh-60px] mx-auto max-w-2xl px-10 lg:max-w-2xl lg:px-5 transition-all">
            <AppConsent
              application={application}
              workspaceSlug={workspace_slug}
              disableDropdown={workspace_slug ? Boolean(disable_dropdown?.toLowerCase() === "true") : false}
              consentParams={{
                client_id,
                redirect_uri,
                code_challenge,
                code_challenge_method,
                response_type,
                scope: "read write",
                nonce,
                state,
                claims,
              }}
              workspaceAppInstallations={workspaceAppInstallations}
              workspacePermissions={applicationPermissions}
            />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}

export default observer(OAuthPage);
