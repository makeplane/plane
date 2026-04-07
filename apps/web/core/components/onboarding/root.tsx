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

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate, useSearchParams } from "react-router";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceMemberInvitation, TOnboardingStep, TOnboardingSteps, TUserProfile } from "@plane/types";
import { EOnboardingSteps } from "@plane/types";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserProfile } from "@/hooks/store/user";
// lib
import { resolveWorkspaceRedirect } from "@/lib/middleware/auth-client-middleware";
// local components
import { OnboardingHeader } from "./header";
import { OnboardingStepRoot } from "./steps";

type Props = {
  invitations?: IWorkspaceMemberInvitation[];
};

export const OnboardingRoot = observer(function OnboardingRoot({ invitations = [] }: Props) {
  const [currentStep, setCurrentStep] = useState<TOnboardingStep>(EOnboardingSteps.PROFILE_SETUP);
  // store hooks
  const { data: user } = useUser();
  const { data: userProfile, updateUserProfile, finishUserOnboarding } = useUserProfile();
  const { config: instanceConfig } = useInstance();
  const { workspaces, fetchWorkspaces } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const workspacesList = Object.values(workspaces ?? {});
  const isSelfManaged = instanceConfig?.is_self_managed;

  // Calculate total steps based on whether invitations are available
  const hasInvitations = invitations.length > 0;

  // complete onboarding
  const finishOnboarding = useCallback(async () => {
    if (!user) return;
    try {
      await finishUserOnboarding();
      await fetchWorkspaces();
      const nextPath = searchParams.get("next_path");
      const redirectionRoute = resolveWorkspaceRedirect({ nextPath, isFirstTimeOnboarding: true });
      void navigate(redirectionRoute, { replace: true });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed",
        message: "Failed to finish onboarding, Please try again later.",
      });
    }
  }, [user, finishUserOnboarding, fetchWorkspaces, searchParams, navigate]);

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
          if (isSelfManaged) {
            // Skip role & use case steps for self-hosted
            void stepChange({ profile_complete: true });
            if (workspacesList.length > 0) finishOnboarding();
            else setCurrentStep(EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN);
          } else {
            setCurrentStep(EOnboardingSteps.ROLE_SETUP);
          }
          break;
        case EOnboardingSteps.ROLE_SETUP:
          setCurrentStep(EOnboardingSteps.USE_CASE_SETUP);
          break;
        case EOnboardingSteps.USE_CASE_SETUP:
          void stepChange({ profile_complete: true });
          if (workspacesList.length > 0) finishOnboarding();
          else setCurrentStep(EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN);
          break;
        case EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN:
          if (skipInvites) finishOnboarding();
          else {
            setCurrentStep(EOnboardingSteps.INVITE_MEMBERS);
            void stepChange({ workspace_create: true });
          }
          break;
        case EOnboardingSteps.INVITE_MEMBERS:
          void stepChange({ workspace_invite: true });
          finishOnboarding();
          break;
      }
    },
    [stepChange, finishOnboarding, workspacesList, isSelfManaged]
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
    // oxlint-disable-next-line react-hooks/exhaustive-deps
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
