import { ReactElement, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// types
import { TOnboardingSteps, TUserProfile } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { InviteMembers, CreateOrJoinWorkspaces, ProfileSetup } from "@/components/onboarding";
// constants
import { USER_ONBOARDING_COMPLETED } from "@/constants/event-tracker";
import { USER_WORKSPACES_LIST } from "@/constants/fetch-keys";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useUser, useWorkspace, useUserProfile, useEventTracker } from "@/hooks/store";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// lib types
import { NextPageWithLayout } from "@/lib/types";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// services
import { WorkspaceService } from "@/services/workspace.service";

export enum EOnboardingSteps {
  PROFILE_SETUP = "PROFILE_SETUP",
  WORKSPACE_CREATE_OR_JOIN = "WORKSPACE_CREATE_OR_JOIN",
  INVITE_MEMBERS = "INVITE_MEMBERS",
}

const workspaceService = new WorkspaceService();

const OnboardingPage: NextPageWithLayout = observer(() => {
  // states
  const [step, setStep] = useState<EOnboardingSteps | null>(null);
  const [totalSteps, setTotalSteps] = useState<number | null>(null);
  // router
  const router = useRouter();
  // store hooks
  const { captureEvent } = useEventTracker();
  const { data: user, updateCurrentUser } = useUser();
  const { data: profile, updateUserOnBoard, updateUserProfile } = useUserProfile();
  const { workspaces, fetchWorkspaces } = useWorkspace();

  // computed values
  const workspacesList = Object.values(workspaces ?? {});
  // fetching workspaces list
  useSWR(USER_WORKSPACES_LIST, () => fetchWorkspaces(), {
    shouldRetryOnError: false,
  });
  // fetching user workspace invitations
  const { data: invitations } = useSWR("USER_WORKSPACE_INVITATIONS_LIST", () =>
    workspaceService.userWorkspaceInvitations()
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
    if (!user || !workspaces) return;

    const firstWorkspace = Object.values(workspaces ?? {})?.[0];

    await Promise.all([
      updateUserProfile({
        onboarding_step: {
          profile_complete: true,
          workspace_join: true,
          workspace_create: true,
          workspace_invite: true,
        },
        last_workspace_id: firstWorkspace?.id,
      }),
      updateUserOnBoard(),
    ])
      .then(() => {
        captureEvent(USER_ONBOARDING_COMPLETED, {
          // user_role: user.role,
          email: user.email,
          user_id: user.id,
          status: "SUCCESS",
        });
      })
      .catch(() => {
        console.log("Failed to update onboarding status");
      });

    router.replace(`/${firstWorkspace?.slug}`);
  };

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleStepChange = async () => {
      if (!user) return;

      const onboardingStep = profile.onboarding_step;

      if (!onboardingStep.profile_complete) setStep(EOnboardingSteps.PROFILE_SETUP);

      // For Invited Users, they will skip all other steps.
      if (totalSteps && totalSteps <= 2) return;

      if (onboardingStep.profile_complete && !(onboardingStep.workspace_join || onboardingStep.workspace_create)) {
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
    <>
      <PageHead title="Onboarding" />
      {user && totalSteps && step !== null && invitations ? (
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
              invitations={invitations}
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
    </>
  );
});

OnboardingPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthenticationWrapper pageType={EPageTypes.ONBOARDING}>
      <DefaultLayout>{page}</DefaultLayout>
    </AuthenticationWrapper>
  );
};

export default OnboardingPage;
