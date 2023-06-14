import { useEffect, useState } from "react";
// next imports
import Router from "next/router";
// services
import userService from "services/user.service";
import workspaceService from "services/workspace.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import {
  InviteMembers,
  OnboardingCard,
  OnboardingLogo,
  UserDetails,
  Workspace,
} from "components/onboarding";
// ui
import { PrimaryButton, Spinner } from "components/ui";
// constant
import { ONBOARDING_CARDS } from "constants/workspace";
// types
import type { NextPage } from "next";

const Onboarding: NextPage = () => {
  const [step, setStep] = useState<null | number>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [workspace, setWorkspace] = useState();

  const { user, isLoading: userLoading, mutateUser } = useUserAuth("onboarding");

  useEffect(() => {
    if (user && step === null) {
      let currentStep: number = 1;
      if (user?.role) currentStep = 2;
      if (user?.last_workspace_id) currentStep = 4;
      setStep(() => currentStep);
    }
  }, [step, user]);

  return (
    <DefaultLayout>
      {userLoading || isLoading || step === null ? (
        <div className="grid h-screen place-items-center">
          <Spinner />
        </div>
      ) : (
        <div className="relative grid h-full place-items-center p-5">
          {step <= 3 ? (
            <div className="h-full flex flex-col justify-center w-full py-4">
              <div className="mb-7 flex items-center justify-center text-center">
                <OnboardingLogo className="h-12 w-48 fill-current text-brand-base" />
              </div>
              {step === 1 ? (
                <UserDetails user={user} setStep={setStep} setUserRole={setUserRole} />
              ) : step === 2 ? (
                <Workspace setStep={setStep} setWorkspace={setWorkspace} user={user} />
              ) : (
                step === 3 && <InviteMembers setStep={setStep} workspace={workspace} user={user} />
              )}
            </div>
          ) : (
            <div className="flex w-full max-w-2xl flex-col gap-12">
              <div className="flex flex-col items-center justify-center gap-7 rounded-[10px] bg-brand-base pb-7 text-center shadow-md">
                {step === 4 ? (
                  <OnboardingCard data={ONBOARDING_CARDS.welcome} />
                ) : step === 5 ? (
                  <OnboardingCard data={ONBOARDING_CARDS.issue} gradient />
                ) : step === 6 ? (
                  <OnboardingCard data={ONBOARDING_CARDS.cycle} gradient />
                ) : step === 7 ? (
                  <OnboardingCard data={ONBOARDING_CARDS.module} gradient />
                ) : (
                  step === 8 && <OnboardingCard data={ONBOARDING_CARDS.commandMenu} />
                )}
                <div className="mx-auto flex h-1/4 items-end lg:w-1/2">
                  <PrimaryButton
                    type="button"
                    className="flex w-full items-center justify-center text-center "
                    size="md"
                    onClick={() => {
                      if (step === 8) {
                        setIsLoading(true);
                        userService
                          .updateUserOnBoard({ userRole }, user)
                          .then(async () => {
                            mutateUser();
                            const userWorkspaces = await workspaceService.userWorkspaces();

                            const lastActiveWorkspace =
                              userWorkspaces.find(
                                (workspace) => workspace.id === user?.last_workspace_id
                              ) ?? userWorkspaces[0];

                            if (lastActiveWorkspace) {
                              userService
                                .updateUser({
                                  last_workspace_id: lastActiveWorkspace.id,
                                })
                                .then((res) => {
                                  mutateUser();
                                })
                                .catch((err) => {
                                  console.log(err);
                                });
                              Router.push(`/${lastActiveWorkspace.slug}`);
                              return;
                            } else {
                              const invitations = await workspaceService.userWorkspaceInvitations();
                              if (invitations.length > 0) {
                                Router.push(`/invitations`);
                                return;
                              } else {
                                Router.push(`/create-workspace`);
                                return;
                              }
                            }
                          })
                          .catch((err) => {
                            setIsLoading(false);
                            console.log(err);
                          });
                      } else setStep((prevData) => (prevData != null ? prevData + 1 : prevData));
                    }}
                  >
                    {step === 4 || step === 8 ? "Get Started" : "Next"}
                  </PrimaryButton>
                </div>
              </div>
            </div>
          )}
          <div className="absolute flex flex-col gap-1 justify-center items-start left-5 top-5">
            <span className="text-xs text-brand-secondary">Logged in:</span>
            <span className="text-sm text-brand-base">{user?.email}</span>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default Onboarding;
