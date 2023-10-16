import { useEffect, useState } from "react";

import Image from "next/image";

import useSWR, { mutate } from "swr";

// next-themes
import { useTheme } from "next-themes";
// services
import { UserService } from "services/user.service";
import { WorkspaceService } from "services/workspace.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useWorkspaces from "hooks/use-workspaces";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import { InviteMembers, JoinWorkspaces, UserDetails, Workspace } from "components/onboarding";
// ui
import { Spinner } from "@plane/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
import BlackHorizontalLogo from "public/plane-logos/black-horizontal-with-blue-logo.svg";
import WhiteHorizontalLogo from "public/plane-logos/white-horizontal-with-blue-logo.svg";
// types
import { IUser, TOnboardingSteps } from "types";
import type { NextPage } from "next";
// fetch-keys
import { CURRENT_USER, USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";

// services
const userService = new UserService();
const workspaceService = new WorkspaceService();

const Onboarding: NextPage = () => {
  const [step, setStep] = useState<number | null>(null);

  const { theme, setTheme } = useTheme();

  const { user, isLoading: userLoading } = useUserAuth("onboarding");

  const { workspaces } = useWorkspaces();
  const userWorkspaces = workspaces?.filter((w) => w.created_by === user?.id);

  const { data: invitations } = useSWR(USER_WORKSPACE_INVITATIONS, () => workspaceService.userWorkspaceInvitations());

  // update last active workspace details
  const updateLastWorkspace = async () => {
    if (!workspaces) return;

    await mutate<IUser>(
      CURRENT_USER,
      (prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          last_workspace_id: workspaces[0]?.id,
          // workspace: {
          //   ...prevData.workspace,
          //   fallback_workspace_id: workspaces[0]?.id,
          //   fallback_workspace_slug: workspaces[0]?.slug,
          //   last_workspace_id: workspaces[0]?.id,
          //   last_workspace_slug: workspaces[0]?.slug,
          // },
        };
      },
      false
    );

    await userService.updateUser({ last_workspace_id: workspaces?.[0]?.id });
  };

  // handle step change
  const stepChange = async (steps: Partial<TOnboardingSteps>) => {
    if (!user) return;

    const payload: Partial<IUser> = {
      onboarding_step: {
        ...user.onboarding_step,
        ...steps,
      },
    };

    mutate<IUser>(
      CURRENT_USER,
      (prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          ...payload,
        };
      },
      false
    );

    await userService.updateUser(payload);
  };

  // complete onboarding
  const finishOnboarding = async () => {
    if (!user) return;

    mutate<IUser>(
      CURRENT_USER,
      (prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          is_onboarded: true,
        };
      },
      false
    );

    await userService.updateUserOnBoard({ userRole: user.role }, user);
  };

  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  useEffect(() => {
    const handleStepChange = async () => {
      if (!user || !invitations) return;

      const onboardingStep = user.onboarding_step;

      if (!onboardingStep.profile_complete && step !== 1) setStep(1);

      if (onboardingStep.profile_complete) {
        if (!onboardingStep.workspace_join && invitations.length > 0 && step !== 2 && step !== 4) setStep(4);
        else if (!onboardingStep.workspace_create && (step !== 4 || onboardingStep.workspace_join) && step !== 2)
          setStep(2);
      }

      if (
        onboardingStep.profile_complete &&
        onboardingStep.workspace_create &&
        !onboardingStep.workspace_invite &&
        step !== 3
      )
        setStep(3);
    };

    handleStepChange();
  }, [user, invitations, step]);

  if (userLoading || step === null)
    return (
      <div className="grid h-screen place-items-center">
        <Spinner />
      </div>
    );

  return (
    <DefaultLayout>
      <div className="flex h-full w-full flex-col gap-y-2 sm:gap-y-0 sm:flex-row overflow-hidden">
        <div className="relative h-1/6 flex-shrink-0 sm:w-2/12 md:w-3/12 lg:w-1/5">
          <div className="absolute border-b-[0.5px] sm:border-r-[0.5px] border-custom-border-200 h-[0.5px] w-full top-1/2 left-0 -translate-y-1/2 sm:h-screen sm:w-[0.5px] sm:top-0 sm:left-1/2 md:left-1/3 sm:-translate-x-1/2 sm:translate-y-0 z-10" />
          {step === 1 ? (
            <div className="absolute grid place-items-center bg-custom-background-100 px-3 sm:px-0 py-5 left-2 sm:left-1/2 md:left-1/3 sm:-translate-x-1/2 top-1/2 -translate-y-1/2 sm:translate-y-0 sm:top-12 z-10">
              <div className="h-[30px] w-[30px]">
                <Image src={BluePlaneLogoWithoutText} alt="Plane logo" />
              </div>
            </div>
          ) : (
            <div className="absolute grid place-items-center bg-custom-background-100 px-3 sm:px-0 sm:py-5 left-5 sm:left-1/2 md:left-1/3 sm:-translate-x-[15px] top-1/2 -translate-y-1/2 sm:translate-y-0 sm:top-12 z-10">
              <div className="h-[30px] w-[133px]">
                {theme === "light" ? (
                  <Image src={BlackHorizontalLogo} alt="Plane black logo" />
                ) : (
                  <Image src={WhiteHorizontalLogo} alt="Plane white logo" />
                )}
              </div>
            </div>
          )}
          <div className="absolute sm:fixed text-custom-text-100 text-sm font-medium right-4 top-1/4 sm:top-12 -translate-y-1/2 sm:translate-y-0 sm:right-16 sm:py-5">
            {user?.email}
          </div>
        </div>
        <div className="relative flex justify-center sm:items-center h-full px-8 pb-0 sm:px-0 sm:py-12 sm:pr-[8.33%] sm:w-10/12 md:w-9/12 lg:w-4/5 overflow-hidden">
          {step === 1 ? (
            <UserDetails user={user} />
          ) : step === 2 ? (
            <Workspace
              finishOnboarding={finishOnboarding}
              stepChange={stepChange}
              updateLastWorkspace={updateLastWorkspace}
              user={user}
              workspaces={workspaces}
            />
          ) : step === 3 ? (
            <InviteMembers
              finishOnboarding={finishOnboarding}
              stepChange={stepChange}
              user={user}
              workspace={userWorkspaces?.[0]}
            />
          ) : (
            step === 4 && (
              <JoinWorkspaces
                finishOnboarding={finishOnboarding}
                stepChange={stepChange}
                updateLastWorkspace={updateLastWorkspace}
              />
            )
          )}
        </div>
        {step !== 4 && (
          <div className="sticky sm:fixed bottom-0 md:bottom-14 md:right-16 py-6 md:py-0 flex justify-center md:justify-end bg-custom-background-100 md:bg-transparent pointer-events-none w-full z-[1]">
            <div className="w-3/4 md:w-1/5 space-y-1">
              <p className="text-xs text-custom-text-200">{step} of 3 steps</p>
              <div className="relative h-1 w-full rounded bg-custom-background-80">
                <div
                  className="absolute top-0 left-0 h-1 rounded bg-custom-primary-100 duration-300"
                  style={{
                    width: `${((step / 3) * 100).toFixed(0)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default Onboarding;
