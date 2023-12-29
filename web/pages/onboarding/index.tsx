import { useEffect, useState, ReactElement } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { ChevronDown } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { Controller, useForm } from "react-hook-form";
// hooks
import { useApplication, useUser, useWorkspace } from "hooks/store";
import useUserAuth from "hooks/use-user-auth";
// services
import { WorkspaceService } from "services/workspace.service";
// layouts
import DefaultLayout from "layouts/default-layout";
import { UserAuthWrapper } from "layouts/auth-layout";
// components
import { InviteMembers, JoinWorkspaces, UserDetails, SwitchOrDeleteAccountModal } from "components/onboarding";
// ui
import { Avatar, Spinner } from "@plane/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
// types
import { IUser, TOnboardingSteps } from "@plane/types";
import { NextPageWithLayout } from "lib/types";

// services
const workspaceService = new WorkspaceService();

const OnboardingPage: NextPageWithLayout = observer(() => {
  // states
  const [step, setStep] = useState<number | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  // router
  const router = useRouter();
  // store hooks
  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const { currentUser, currentUserLoader, updateCurrentUser, updateUserOnBoard } = useUser();
  const { workspaces, fetchWorkspaces } = useWorkspace();
  // custom hooks
  const {} = useUserAuth({ routeAuth: "onboarding", user: currentUser, isLoading: currentUserLoader });

  const user = currentUser ?? undefined;
  const workspacesList = Object.values(workspaces ?? {});

  const { setTheme } = useTheme();

  const { control, setValue } = useForm<{ full_name: string }>({
    defaultValues: {
      full_name: "",
    },
  });

  useSWR(`USER_WORKSPACES_LIST`, () => fetchWorkspaces(), {
    shouldRetryOnError: false,
  });

  const { data: invitations } = useSWR("USER_WORKSPACE_INVITATIONS_LIST", () =>
    workspaceService.userWorkspaceInvitations()
  );

  // handle step change
  const stepChange = async (steps: Partial<TOnboardingSteps>) => {
    if (!user) return;

    const payload: Partial<IUser> = {
      onboarding_step: {
        ...user.onboarding_step,
        ...steps,
      },
    };

    await updateCurrentUser(payload);
  };
  // complete onboarding
  const finishOnboarding = async () => {
    if (!user || !workspacesList) return;

    await updateUserOnBoard()
      .then(() => {
        postHogEventTracker("USER_ONBOARDING_COMPLETE", {
          user_role: user.role,
          email: user.email,
          user_id: user.id,
          status: "SUCCESS",
        });
      })
      .catch((error) => {
        console.log(error);
      });

    router.replace(`/${workspacesList[0]?.slug}`);
  };

  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  useEffect(() => {
    const handleStepChange = async () => {
      if (!user || !invitations) return;

      const onboardingStep = user.onboarding_step;

      if (
        !onboardingStep.workspace_join &&
        !onboardingStep.workspace_create &&
        workspacesList &&
        workspacesList?.length > 0
      ) {
        await updateCurrentUser({
          onboarding_step: {
            ...user.onboarding_step,
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
      <SwitchOrDeleteAccountModal isOpen={showDeleteAccountModal} onClose={() => setShowDeleteAccountModal(false)} />
      {user && step !== null ? (
        <div className={`fixed flex h-full w-full flex-col bg-onboarding-gradient-100`}>
          <div className="flex items-center px-4 py-10 sm:px-7 sm:pb-8 sm:pt-14 md:px-14 lg:pl-28 lg:pr-24">
            <div className="flex w-full items-center justify-between font-semibold ">
              <div className="flex items-center gap-x-1 text-3xl">
                <Image src={BluePlaneLogoWithoutText} alt="Plane Logo" height={30} width={30} />
                Plane
              </div>

              <div>
                <Controller
                  control={control}
                  name="full_name"
                  render={({ field: { value } }) => (
                    <div className="flex items-center gap-x-2 pr-4">
                      {step != 1 && (
                        <Avatar
                          name={
                            currentUser?.first_name
                              ? `${currentUser?.first_name} ${currentUser?.last_name ?? ""}`
                              : value.length > 0
                              ? value
                              : currentUser?.email
                          }
                          src={currentUser?.avatar}
                          size={35}
                          shape="square"
                          fallbackBackgroundColor="#FCBE1D"
                          className="!text-base capitalize"
                        />
                      )}
                      <div>
                        {step != 1 && (
                          <p className="text-sm font-medium text-custom-text-200">
                            {currentUser?.first_name
                              ? `${currentUser?.first_name} ${currentUser?.last_name ?? ""}`
                              : value.length > 0
                              ? value
                              : null}
                          </p>
                        )}

                        <Menu>
                          <Menu.Button className={"flex items-center gap-x-2"}>
                            <span className="text-base font-medium">{user.email}</span>
                            <ChevronDown className="h-4 w-4 text-custom-text-300" />
                          </Menu.Button>
                          <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                          >
                            <Menu.Items className={"absolute min-w-full"}>
                              <Menu.Item as="div">
                                <div
                                  className="mr-auto mt-2 rounded-md border border-red-400 bg-onboarding-background-200 p-3 text-base font-normal text-red-400 shadow-sm hover:cursor-pointer"
                                  onClick={() => {
                                    setShowDeleteAccountModal(true);
                                  }}
                                >
                                  Wrong e-mail address?
                                </div>
                              </Menu.Item>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
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
                <UserDetails setUserName={(value) => setValue("full_name", value)} user={user} />
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
