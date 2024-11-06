"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// types
import { TOnboardingSteps, TUserProfile } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common";
import { InviteMembers, CreateOrJoinWorkspaces, ProfileSetup } from "@/components/onboarding";
// constants
import { USER_ONBOARDING_COMPLETED } from "@/constants/event-tracker";
import { USER_WORKSPACES_LIST } from "@/constants/fetch-keys";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useUser, useWorkspace, useUserProfile, useEventTracker } from "@/hooks/store";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
import { WorkspaceService } from "@/plane-web/services";
// services

enum EOnboardingSteps {
  PROFILE_SETUP = "PROFILE_SETUP",
  WORKSPACE_CREATE_OR_JOIN = "WORKSPACE_CREATE_OR_JOIN",
  INVITE_MEMBERS = "INVITE_MEMBERS",
}

const workspaceService = new WorkspaceService();

const OnboardingPage = observer(() => {
  // states
  const [step, setStep] = useState<EOnboardingSteps | null>(null);
  const [totalSteps, setTotalSteps] = useState<number | null>(null);
  // store hooks
  const { captureEvent } = useEventTracker();
  const { isLoading: userLoader, data: user, updateCurrentUser } = useUser();
  const { data: profile, updateUserProfile, finishUserOnboarding } = useUserProfile();
  const { workspaces, fetchWorkspaces } = useWorkspace();

  // computed values
  const workspacesList = Object.values(workspaces ?? {});
  // fetching workspaces list
  const { isLoading: workspaceListLoader } = useSWR(USER_WORKSPACES_LIST, () => {
    user?.id && fetchWorkspaces();
  });
  // fetching user workspace invitations
  const { isLoading: invitationsLoader, data: invitations } = useSWR(
    `USER_WORKSPACE_INVITATIONS_LIST_${user?.id}`,
    () => {
      if (user?.id) return workspaceService.userWorkspaceInvitations();
    }
  );
  // handle step change
  const stepChange = async (steps: Partial<TOnboardingSteps>) => {
    if (!user) return;

    const payload: Partial<TUserProfile> = {
      onboarding_step: {
        ...profile.onboarding_step,
        ...steps,
      },
    };

    await updateUserProfile(payload);
  };

  // complete onboarding
  const finishOnboarding = async () => {
    if (!user) return;

    await finishUserOnboarding()
      .then(() => {
        captureEvent(USER_ONBOARDING_COMPLETED, {
          // user_role: user.role,
          email: user.email,
          user_id: user.id,
          status: "SUCCESS",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Failed",
          message: "Failed to finish onboarding, Please try again later.",
        });
      });
  };

  useEffect(() => {
    // Never update the total steps if it's already set.
    if (!totalSteps && userLoader === false && workspaceListLoader === false) {
      // If user is already invited to a workspace, only show profile setup steps.
      if (workspacesList && workspacesList?.length > 0) {
        // If password is auto set then show two different steps for profile setup, else merge them.
        if (user?.is_password_autoset) setTotalSteps(2);
        else setTotalSteps(1);
      } else {
        // If password is auto set then total steps will increase to 4 due to extra step at profile setup stage.
        if (user?.is_password_autoset) setTotalSteps(4);
        else setTotalSteps(3);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoader, workspaceListLoader]);

  // If the user completes the profile setup and has workspaces (through invitations), then finish the onboarding.
  useEffect(() => {
    if (userLoader === false && profile && workspaceListLoader === false) {
      const onboardingStep = profile.onboarding_step;
      if (onboardingStep.profile_complete && !onboardingStep.workspace_create && workspacesList.length > 0)
        finishOnboarding();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoader, profile, workspaceListLoader]);

  useEffect(() => {
    const handleStepChange = async () => {
      if (!user) return;

      const onboardingStep = profile.onboarding_step;

      if (!onboardingStep.profile_complete) setStep(EOnboardingSteps.PROFILE_SETUP);

      if (
        onboardingStep.profile_complete &&
        !(onboardingStep.workspace_join || onboardingStep.workspace_create || workspacesList?.length > 0)
      ) {
        setStep(EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN);
      }

      if (
        onboardingStep.profile_complete &&
        (onboardingStep.workspace_join || onboardingStep.workspace_create) &&
        !onboardingStep.workspace_invite
      )
        setStep(EOnboardingSteps.INVITE_MEMBERS);
    };

    handleStepChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, step, profile.onboarding_step, updateCurrentUser, workspacesList]);

  return (
    <AuthenticationWrapper pageType={EPageTypes.ONBOARDING}>
      {user && totalSteps && step !== null && !invitationsLoader ? (
        <div className={`flex h-full w-full flex-col`}>
          {step === EOnboardingSteps.PROFILE_SETUP ? (
            <ProfileSetup
              user={user}
              totalSteps={totalSteps}
              stepChange={stepChange}
              finishOnboarding={finishOnboarding}
            />
          ) : step === EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN ? (
            <CreateOrJoinWorkspaces
              invitations={invitations ?? []}
              totalSteps={totalSteps}
              stepChange={stepChange}
              finishOnboarding={finishOnboarding}
            />
          ) : step === EOnboardingSteps.INVITE_MEMBERS ? (
            <InviteMembers
              finishOnboarding={finishOnboarding}
              totalSteps={totalSteps}
              user={user}
              workspace={workspacesList?.[0]}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              Something Went wrong. Please try again.
            </div>
          )}
        </div>
      ) : (
        <div className="grid h-screen w-full place-items-center">
          <LogoSpinner />
        </div>
      )}
    </AuthenticationWrapper>
  );
});

export default OnboardingPage;
