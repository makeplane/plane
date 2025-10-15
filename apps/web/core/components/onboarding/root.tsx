"use client";

import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { USER_TRACKER_EVENTS } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceMemberInvitation, TOnboardingStep, TOnboardingSteps, TUserProfile } from "@plane/types";
import { EOnboardingSteps } from "@plane/types";
// helpers
import { captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserProfile } from "@/hooks/store/user";
// local components
import { OnboardingHeader } from "./header";
import { OnboardingStepRoot } from "./steps";

type Props = {
  invitations?: IWorkspaceMemberInvitation[];
};

export const OnboardingRoot: FC<Props> = observer(({ invitations = [] }) => {
  const [currentStep, setCurrentStep] = useState<TOnboardingStep>(EOnboardingSteps.PROFILE_SETUP);
  // store hooks
  const { data: user } = useUser();
  const { data: userProfile, updateUserProfile, finishUserOnboarding } = useUserProfile();
  const { workspaces } = useWorkspace();

  const workspacesList = Object.values(workspaces ?? {});

  // Calculate total steps based on whether invitations are available
  const hasInvitations = invitations.length > 0;

  // complete onboarding
  const finishOnboarding = useCallback(async () => {
    if (!user) return;

    await finishUserOnboarding()
      .then(() => {
        captureSuccess({
          eventName: USER_TRACKER_EVENTS.onboarding_complete,
          payload: {
            email: user.email,
            user_id: user.id,
          },
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Failed",
          message: "Failed to finish onboarding, Please try again later.",
        });
      });
  }, [user, finishUserOnboarding]);

  // handle step change
  const stepChange = useCallback(
    async (steps: Partial<TOnboardingSteps>) => {
      if (!user) return;

      const payload: Partial<TUserProfile> = {
        onboarding_step: {
          ...userProfile.onboarding_step,
          ...steps,
        },
      };

      await updateUserProfile(payload);
    },
    [user, userProfile, updateUserProfile]
  );

  const handleStepChange = useCallback(
    (step: EOnboardingSteps, skipInvites?: boolean) => {
      switch (step) {
        case EOnboardingSteps.PROFILE_SETUP:
          setCurrentStep(EOnboardingSteps.ROLE_SETUP);
          break;
        case EOnboardingSteps.ROLE_SETUP:
          setCurrentStep(EOnboardingSteps.USE_CASE_SETUP);
          break;
        case EOnboardingSteps.USE_CASE_SETUP:
          stepChange({ profile_complete: true });
          if (workspacesList.length > 0) finishOnboarding();
          else setCurrentStep(EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN);
          break;
        case EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN:
          if (skipInvites) finishOnboarding();
          else {
            setCurrentStep(EOnboardingSteps.INVITE_MEMBERS);
            stepChange({ workspace_create: true });
          }
          break;
        case EOnboardingSteps.INVITE_MEMBERS:
          stepChange({ workspace_invite: true });
          finishOnboarding();
          break;
      }
    },
    [stepChange, finishOnboarding, workspacesList]
  );

  const updateCurrentStep = (step: EOnboardingSteps) => setCurrentStep(step);

  useEffect(() => {
    const handleInitialStep = () => {
      if (
        userProfile?.onboarding_step?.profile_complete &&
        !userProfile?.onboarding_step?.workspace_create &&
        !userProfile?.onboarding_step?.workspace_join
      ) {
        setCurrentStep(EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN);
      }
      if (
        userProfile?.onboarding_step?.profile_complete &&
        userProfile?.onboarding_step?.workspace_create &&
        !userProfile?.onboarding_step?.workspace_invite
      ) {
        setCurrentStep(EOnboardingSteps.INVITE_MEMBERS);
      }
    };

    handleInitialStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header with progress */}
      <OnboardingHeader
        currentStep={currentStep}
        updateCurrentStep={updateCurrentStep}
        hasInvitations={hasInvitations}
      />

      {/* Main content area */}
      <OnboardingStepRoot currentStep={currentStep} invitations={invitations} handleStepChange={handleStepChange} />
    </div>
  );
});
