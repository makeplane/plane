"use client";

import React from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
// ui
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
// components
import useSWR from "swr";
import { PageHead } from "@/components/core";
import { EmailSettingsLoader } from "@/components/ui";
import { APPLICATION_BY_CLIENT_ID } from "@/constants/fetch-keys";
import DefaultLayout from "@/layouts/default-layout";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// assets
import { AppConsent } from "@/plane-web/components/marketplace";
import { ApplicationService } from "@/plane-web/services/marketplace";
import BlackHorizontalLogo from "@/public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "@/public/plane-logos/white-horizontal-with-blue-logo.png";

const applicationService = new ApplicationService();
const OAuthPage = observer(() => {
  const { resolvedTheme } = useTheme();

  const logo = resolvedTheme === "light" ? BlackHorizontalLogo : WhiteHorizontalLogo;

  const searchParams = useSearchParams();
  const { client_id, redirect_uri, code_challenge, code_challenge_method, response_type, scope, nonce, state, claims } = Object.fromEntries(searchParams.entries());

  const { data: application, isLoading } = useSWR(
    client_id ? APPLICATION_BY_CLIENT_ID(client_id?.toString() ?? "") : null,
    client_id ? async () => await applicationService.getApplicationByClientId(client_id?.toString() ?? "") : null
  );

  if (isLoading) {
    return (
      <EmailSettingsLoader />
    )
  }

  if (!application || !client_id || !redirect_uri) {
    return (
      <DefaultLayout>
        <div className="flex flex-col justify-center items-center space-y-4 flex-grow container h-[100vh-60px] mx-auto max-w-2xl px-10 lg:max-w-2xl lg:px-5 transition-all mt-10">
          <Image src={logo} alt="Plane logo" />
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-sm text-gray-500">Please check the URL and try again.</p>
        </div>
      </DefaultLayout>
    )
  }

  return (
    <DefaultLayout>
      <AuthenticationWrapper>
        <>
          <div className="relative w-screen h-screen overflow-hidden">
            <PageHead title={"OAuth | Plane"} />
            <div className="relative z-10 w-screen h-screen overflow-hidden overflow-y-auto flex flex-col">
              <div className="container min-w-full px-5 lg:px-10 py-5 lg:py-5 flex-shrink-0 relative flex justify-start pb-4 transition-all border-b border-border-100">
                  <Link href={`/`} className="h-[30px] w-[133px]">
                    <Image src={logo} alt="Plane logo" />
                  </Link>
              </div>
              <div className="flex flex-col justify-center flex-grow container h-[100vh-60px] mx-auto max-w-2xl px-10 lg:max-w-2xl lg:px-5 transition-all">
                <AppConsent application={application} consentParams={{ client_id, redirect_uri, code_challenge, code_challenge_method, response_type, scope: "read write", nonce, state, claims }} />
              </div>
            </div>
          </div>
        </>
      </AuthenticationWrapper>
    </DefaultLayout>
  );
});

export default OAuthPage;
