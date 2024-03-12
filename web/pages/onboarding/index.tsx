import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { ReactElement, useEffect, useState } from "react";
import useSWR from "swr";
// hooks
import {
  // useEventTracker,
  useUser,
  useUserProfile,
  useWorkspace,
} from "hooks/store";
// hooks
import { Spinner } from "@plane/ui";
import { PageHead } from "components/core";
import {
  InviteMembers,
  JoinWorkspaces,
  OnboardingHeader,
  SwitchOrDeleteAccountModal,
  UserDetails,
} from "components/onboarding";
// import { USER_ONBOARDING_COMPLETED } from "constants/event-tracker";
import useUserAuth from "hooks/use-user-auth";
// services
import { UserAuthWrapper } from "layouts/auth-layout";
import DefaultLayout from "layouts/default-layout";
import { NextPageWithLayout } from "lib/types";
import { WorkspaceService } from "services/workspace.service";
// types
import { TOnboardingSteps, TUserProfile } from "@plane/types";

// services
const workspaceService = new WorkspaceService();

const OnboardingPage: NextPageWithLayout = observer(() => {
  // states
  const [step, setStep] = useState<number | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [fullName, setFullName] = useState<string>("");
  // router
  const router = useRouter();
  // store hooks
  // const { captureEvent } = useEventTracker();
  const { data: user, isLoading: currentUserLoader, updateCurrentUser } = useUser();
  const {
    data: profile,
    // updateUserOnBoard,
    updateUserProfile,
  } = useUserProfile();
  const { workspaces, fetchWorkspaces } = useWorkspace();
  // custom hooks
  const {} = useUserAuth({ routeAuth: "onboarding", user: user || null, isLoading: currentUserLoader });
  // computed values
  const workspacesList = Object.values(workspaces ?? {});
  // fetching workspaces list
  useSWR(`USER_WORKSPACES_LIST`, () => fetchWorkspaces(), {
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

    await updateCurrentUser(payload);
  };
  // complete onboarding
  const finishOnboarding = async () => {
    if (!user || !workspacesList) return;

    // await updateUserOnBoard()
    //   .then(() => {
    //     captureEvent(USER_ONBOARDING_COMPLETED, {
    //       // user_role: user.role,
    //       email: user.email,
    //       user_id: user.id,
    //       status: "SUCCESS",
    //     });
    //   })
    //   .catch(() => {
    //     console.log("Failed to update onboarding status");
    //   });

    router.replace(`/${workspacesList[0]?.slug}`);
  };

  useEffect(() => {
    const handleStepChange = async () => {
      if (!user || !invitations) return;

      const onboardingStep = profile.onboarding_step;

      if (
        !onboardingStep.workspace_join &&
        !onboardingStep.workspace_create &&
        workspacesList &&
        workspacesList?.length > 0
      ) {
        await updateUserProfile({
          onboarding_step: {
            ...profile.onboarding_step,
            workspace_join: true,
            workspace_create: true,
          },
          last_workspace_id: workspacesList[0]?.id,
        });
        setStep(2);
        return;
      }

      if (!onboardingStep.workspace_join && !onboardingStep.workspace_create && step !== 1) setStep(1);

      if (onboardingStep.workspace_join || onboardingStep.workspace_create) {
        if (!onboardingStep.profile_complete && step !== 2) setStep(2);
      }
      if (
        onboardingStep.profile_complete &&
        (onboardingStep.workspace_join || onboardingStep.workspace_create) &&
        !onboardingStep.workspace_invite &&
        step !== 3
      )
        setStep(3);
    };

    handleStepChange();
  }, [user, invitations, step, updateCurrentUser, workspacesList]);

  return (
    <>
      <PageHead title="Onboarding" />
      <SwitchOrDeleteAccountModal isOpen={showDeleteAccountModal} onClose={() => setShowDeleteAccountModal(false)} />
      {user && step !== null ? (
        <div className={`fixed flex h-full w-full flex-col bg-onboarding-gradient-100`}>
          <OnboardingHeader fullName={fullName} step={step} setShowDeleteAccountModal={setShowDeleteAccountModal} />
          <div className="mx-auto h-full w-full overflow-auto rounded-t-md border-x border-t border-custom-border-200 bg-onboarding-gradient-100 px-4 pt-4 shadow-sm sm:w-4/5 lg:w-4/5 xl:w-3/4">
            <div className={`h-full w-full overflow-auto rounded-t-md bg-onboarding-gradient-200`}>
              {step === 1 ? (
                <JoinWorkspaces
                  setTryDiffAccount={() => {
                    setShowDeleteAccountModal(true);
                  }}
                  finishOnboarding={finishOnboarding}
                  stepChange={stepChange}
                />
              ) : step === 2 ? (
                <UserDetails setUserName={(value) => setFullName(value)} user={user} />
              ) : (
                <InviteMembers
                  finishOnboarding={finishOnboarding}
                  stepChange={stepChange}
                  user={user}
                  workspace={workspacesList?.[0]}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid h-screen w-full place-items-center">
          <Spinner />
        </div>
      )}
    </>
  );
});

OnboardingPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <UserAuthWrapper>
      <DefaultLayout>{page}</DefaultLayout>
    </UserAuthWrapper>
  );
};

export default OnboardingPage;
