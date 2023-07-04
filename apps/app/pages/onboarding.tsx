import { useEffect, useState } from "react";

import Router, { useRouter } from "next/router";
import Image from "next/image";

import { mutate } from "swr";

// services
import userService from "services/user.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import { InviteMembers, JoinWorkspaces, UserDetails, Workspace } from "components/onboarding";
// ui
import { Spinner } from "components/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
import BlackHorizontalLogo from "public/plane-logos/black-horizontal.svg";
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
      <div className="flex h-full flex-col gap-y-2 sm:gap-y-0 sm:gap-x-2 sm:flex-row overflow-hidden">
        <div className="relative h-1/6 flex-shrink-0 sm:w-2/12">
          <div className="absolute bg-gray-600 h-[0.5px] w-full top-1/2 left-0 -translate-y-1/2 sm:h-screen sm:w-[0.5px] sm:top-0 sm:left-1/2 sm:-translate-x-1/2 sm:translate-y-0" />
          <div className="absolute bg-brand-base p-5 left-16 top-7 sm:top-8">
            {step === 1 ? (
              <Image src={BluePlaneLogoWithoutText} alt="Plane logo" width={30} height={30} />
            ) : (
              <Image src={BlackHorizontalLogo} alt="Plane logo" width={133} height={30} />
            )}
          </div>
          <div className="text-brand-base text-sm fixed right-4 top-6 sm:right-16 sm:top-16">
            {user?.email}
          </div>
        </div>
        <div className="relative flex justify-center sm:justify-start sm:items-center h-full overflow-y-auto px-8 pb-8 sm:p-0 sm:w-10/12">
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
