import { useEffect, useState } from "react";

import Router from "next/router";
import Image from "next/image";

// services
import userService from "services/user.service";
import workspaceService from "services/workspace.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import { InviteMembers, OnboardingCard, UserDetails, Workspace } from "components/onboarding";
// ui
import { PrimaryButton, Spinner } from "components/ui";
// images
import PlaneLogo from "public/logo.png";
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
        <div className="flex h-full flex-col md:flex-row overflow-hidden">
          <div className="relative h-1/6 flex-shrink-0 md:basis-2/12">
            <div className="absolute bg-gray-600 h-[0.5px] w-full top-16 left-0 md:h-screen md:w-[0.5px] md:top-0 md:left-24" />
            <div className="absolute bg-brand-surface-1 p-5 left-12 top-5 md:top-8">
              <Image src={PlaneLogo} alt="Plane logo" width={50} height={50} className="" />
            </div>
            <div className="text-brand-base text-sm fixed right-4 top-6 md:right-16 md:top-16">
              {user?.email}
            </div>
          </div>

          {step <= 3 ? (
            <div className="relative flex justify-center h-full overflow-y-auto px-8 pb-8 md:p-0 md:items-center md:basis-10/12">
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
              <div className="flex flex-col items-center justify-center gap-7 rounded-[10px] pb-7 text-center shadow-md">
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
                              mutateUser();
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
        </div>
      )}
    </DefaultLayout>
  );
};

export default Onboarding;
