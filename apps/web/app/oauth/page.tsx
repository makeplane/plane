"use client";

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { PlaneLockup } from "@plane/propel/icons";
// components
import { PageHead } from "@/components/core/page-title";
import { EmailSettingsLoader } from "@/components/ui/loader/settings/email";
// constants
import { APPLICATION_BY_CLIENT_ID } from "@/constants/fetch-keys";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
// assets
import { AppConsent } from "@/plane-web/components/marketplace";
import { ApplicationService } from "@/plane-web/services/marketplace";

const applicationService = new ApplicationService();
const OAuthPage = observer(() => {
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
  } = Object.fromEntries(searchParams.entries());

  const { data, isLoading } = useSWR(client_id ? APPLICATION_BY_CLIENT_ID(client_id) : null, async () => {
    const application = await applicationService.getApplicationByClientId(client_id);
    if (!application?.id) return { application, applicationPermissions: null };

    const applicationPermissions = await applicationService.getApplicationPermissions(application.id.toString());
    return { application, applicationPermissions };
  });

  const application = data?.application;
  const applicationPermissions = data?.applicationPermissions?.reduce((acc: any, curr: any) => {
    acc[curr.workspace_id] = curr.state;
    return acc;
  }, {} as any);

  if (isLoading) {
    return <EmailSettingsLoader />;
  }

  if (!application || !client_id || !redirect_uri) {
    return (
      <DefaultLayout>
        <div className="flex flex-col justify-center items-center space-y-4 flex-grow container h-[100vh-60px] mx-auto max-w-2xl px-10 lg:max-w-2xl lg:px-5 transition-all mt-10">
          <PlaneLockup className="h-12 w-auto text-custom-text-100" />
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-sm text-gray-500">Please check the URL and try again.</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <AuthenticationWrapper>
        <>
          <div className="relative w-screen h-screen overflow-hidden">
            <PageHead title={"OAuth | Plane"} />
            <div className="relative z-10 w-screen h-screen overflow-hidden overflow-y-auto flex flex-col">
              <div className="container min-w-full px-5 lg:px-10 py-5 lg:py-5 flex-shrink-0 relative flex justify-start pb-4 transition-all border-b border-custom-border-100">
                <Link href={`/`}>
                  <PlaneLockup className="h-7 w-auto text-custom-text-100" />
                </Link>
              </div>
              <div className="flex flex-col justify-center flex-grow container h-[100vh-60px] mx-auto max-w-2xl px-10 lg:max-w-2xl lg:px-5 transition-all">
                <AppConsent
                  application={application}
                  workspaceSlug={workspace_slug}
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
                  worskapcePermissions={applicationPermissions}
                />
              </div>
            </div>
          </div>
        </>
      </AuthenticationWrapper>
    </DefaultLayout>
  );
});

export default OAuthPage;
