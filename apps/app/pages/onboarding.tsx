import { useState } from "react";

import Image from "next/image";
import Router, { useRouter } from "next/router";

import { mutate } from "swr";

// services
import userService from "services/user.service";
import workspaceService from "services/workspace.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
// layouts
import DefaultLayout from "layouts/default-layout";
import { UserAuthorizationLayout } from "layouts/auth-layout/user-authorization-wrapper";
// components
import {
  InviteMembers,
  OnboardingCard,
  OnboardingLogo,
  UserDetails,
  Workspace,
} from "components/onboarding";
// ui
import { PrimaryButton } from "components/ui";
// constant
import { ONBOARDING_CARDS } from "constants/workspace";
// types
import type { NextPage } from "next";
import { ICurrentUserResponse } from "types";
// fetch-keys
import { CURRENT_USER } from "constants/fetch-keys";

const Onboarding: NextPage = () => {
  const [step, setStep] = useState(1);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [workspace, setWorkspace] = useState();

  const router = useRouter();

  const { user } = useUserAuth("onboarding");

  console.log("user", user);

  return (
    <UserAuthorizationLayout>
      <DefaultLayout>
        <div className="relative grid h-full place-items-center p-5">
          {step <= 3 ? (
            <div className="h-full flex flex-col justify-center w-full py-4">
              <div className="mb-7 flex items-center justify-center text-center">
                <OnboardingLogo className="h-12 w-48 fill-current text-brand-base" />
              </div>
              {step === 1 ? (
                <UserDetails user={user} setStep={setStep} setUserRole={setUserRole} />
              ) : step === 2 ? (
                <Workspace setStep={setStep} setWorkspace={setWorkspace} />
              ) : (
                <InviteMembers setStep={setStep} workspace={workspace} />
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
                  <OnboardingCard data={ONBOARDING_CARDS.commandMenu} />
                )}
                <div className="mx-auto flex h-1/4 items-end lg:w-1/2">
                  <PrimaryButton
                    type="button"
                    className="flex w-full items-center justify-center text-center "
                    size="md"
                    onClick={() => {
                      if (step === 8) {
                        userService
                          .updateUserOnBoard({ userRole })
                          .then(async () => {
                            mutate<ICurrentUserResponse>(
                              CURRENT_USER,
                              (prevData) => {
                                if (!prevData) return prevData;

                                return {
                                  ...prevData,
                                  user: {
                                    ...prevData.user,
                                    is_onboarded: true,
                                  },
                                };
                              },
                              false
                            );
                            const userWorkspaces = await workspaceService.userWorkspaces();

                            const lastActiveWorkspace = userWorkspaces.find(
                              (workspace) => workspace.id === user?.last_workspace_id
                            );

                            if (lastActiveWorkspace) {
                              Router.push(`/${lastActiveWorkspace.slug}`);
                              return;
                            } else if (userWorkspaces.length > 0) {
                              Router.push(`/${userWorkspaces[0].slug}`);
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
                            console.log(err);
                          });
                      } else setStep((prevData) => prevData + 1);
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
      </DefaultLayout>
    </UserAuthorizationLayout>
  );
};

export default Onboarding;
