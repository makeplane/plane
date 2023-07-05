import { useEffect, useState } from "react";

import Router, { useRouter } from "next/router";
import Image from "next/image";

import { mutate } from "swr";

// services
import userService from "services/user.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
import { useTheme } from "next-themes";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import { InviteMembers, JoinWorkspaces, UserDetails, Workspace } from "components/onboarding";
// ui
import { Spinner } from "components/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
import BlackHorizontalLogo from "public/plane-logos/black-horizontal-with-blue-logo.svg";
import WhiteHorizontalLogo from "public/plane-logos/white-horizontal-with-blue-logo.svg";
// types
import { ICurrentUserResponse, IWorkspace } from "types";
import type { NextPage } from "next";
// fetch-keys
import { CURRENT_USER } from "constants/fetch-keys";

const Onboarding: NextPage = () => {
  const [step, setStep] = useState<number | null>(null);

  const [workspace, setWorkspace] = useState<IWorkspace | null>(null);

  const router = useRouter();
  const { state } = router.query;

  const { theme } = useTheme();

  const { user, isLoading: userLoading } = useUserAuth("onboarding");

  const updateLastWorkspace = async () => {
    if (!workspace) return;

    mutate<ICurrentUserResponse>(
      CURRENT_USER,
      (prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          last_workspace_id: workspace.id,
          workspace: {
            ...prevData.workspace,
            fallback_workspace_id: workspace.id,
            fallback_workspace_slug: workspace.slug,
            last_workspace_id: workspace.id,
            last_workspace_slug: workspace.slug,
          },
        };
      },
      false
    );

    await userService.updateUser({ last_workspace_id: workspace.id });
  };

  useEffect(() => {
    const handleStateChange = async () => {
      if (!user) return;

      if (!user.role)
        await Router.push({
          pathname: `/onboarding`,
          query: {
            state: "profile-creation",
          },
        });

      if (user.role && !user.last_workspace_id)
        await Router.push({
          pathname: `/onboarding`,
          query: {
            state: "workspace-creation",
          },
        });
    };

    if (user)
      handleStateChange().then(() => {
        if (state === "profile-creation" && !user.role) setStep(1);
        else if (state === "workspace-creation" && user.role) setStep(2);
      });
  }, [state, user]);

  if (userLoading || step === null)
    return (
      <div className="grid h-screen place-items-center">
        <Spinner />
      </div>
    );

  return (
    <DefaultLayout>
      <div className="flex h-full flex-col gap-y-2 sm:gap-y-0 sm:flex-row overflow-hidden">
        <div className="relative h-1/6 flex-shrink-0 sm:w-2/12 md:w-3/12 lg:w-1/5">
          <div className="absolute sm:border-r-[0.5px] border-brand-base h-[0.5px] w-full top-1/2 left-0 -translate-y-1/2 sm:h-screen sm:w-[0.5px] sm:top-0 sm:left-1/2 md:left-1/3 sm:-translate-x-1/2 sm:translate-y-0" />
          {step === 1 ? (
            <div className="absolute grid place-items-center bg-brand-base py-5 sm:left-1/2 md:left-1/3 sm:-translate-x-1/2 sm:top-12">
              <div className="h-[30px] w-[30px]">
                <Image src={BluePlaneLogoWithoutText} alt="Plane logo" />
              </div>
            </div>
          ) : (
            <div className="absolute grid place-items-center bg-brand-base py-5 sm:left-1/2 md:left-1/3 sm:-translate-x-[15px] sm:top-12">
              <div className="h-[30px] w-[133px]">
                {theme === "light" ? (
                  <Image src={BlackHorizontalLogo} alt="Plane black logo" />
                ) : (
                  <Image src={WhiteHorizontalLogo} alt="Plane white logo" />
                )}
              </div>
            </div>
          )}
          <div className="text-brand-base text-sm fixed right-4 top-6 sm:right-16 sm:top-12 py-5">
            {user?.email}
          </div>
          <div className="fixed w-[200px] md:w-1/5 right-4 bottom-6 sm:right-16 sm:bottom-12 py-5 space-y-1">
            <p className="text-xs text-brand-secondary">{step} of 4 steps</p>
            <div className="relative h-1 w-full rounded bg-brand-surface-2">
              <div
                className="absolute top-0 left-0 h-1 rounded bg-brand-accent duration-300"
                style={{
                  width: `${((step / 4) * 100).toFixed(0)}%`,
                }}
              />
            </div>
          </div>
        </div>
        <div className="relative flex justify-center sm:justify-start sm:items-center h-full px-8 pb-8 sm:p-0 sm:pr-[8.33%] sm:w-10/12 md:w-9/12 lg:w-4/5">
          {step === 1 ? (
            <UserDetails user={user} setStep={setStep} />
          ) : step === 2 ? (
            <Workspace setStep={setStep} setWorkspace={setWorkspace} user={user} />
          ) : step === 3 ? (
            <InviteMembers
              setStep={setStep}
              workspace={workspace}
              updateLastWorkspace={updateLastWorkspace}
              user={user}
            />
          ) : (
            step === 4 && <JoinWorkspaces updateLastWorkspace={updateLastWorkspace} />
          )}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default Onboarding;
