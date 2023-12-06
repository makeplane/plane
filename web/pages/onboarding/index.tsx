import { useEffect, useState, ReactElement } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { ChevronDown } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { Controller, useForm } from "react-hook-form";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { WorkspaceService } from "services/workspace.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
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
import { IUser, TOnboardingSteps } from "types";
import { NextPageWithLayout } from "types/app";

// services
const workspaceService = new WorkspaceService();

const OnboardingPage: NextPageWithLayout = observer(() => {
  const [step, setStep] = useState<number | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const {
    user: { currentUser, updateCurrentUser, updateUserOnBoard },
    workspace: workspaceStore,
    trackEvent: { postHogEventTracker }
  } = useMobxStore();
  const router = useRouter();

  const user = currentUser ?? undefined;
  const workspaces = workspaceStore.workspaces;

  const { setTheme } = useTheme();

  const {} = useUserAuth("onboarding");

  const { control, setValue } = useForm<{ full_name: string }>({
    defaultValues: {
      full_name: "",
    },
  });

  useSWR(`USER_WORKSPACES_LIST`, () => workspaceStore.fetchWorkspaces(), {
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
    if (!user || !workspaces) return;

    await updateUserOnBoard().then(() => {
      postHogEventTracker(
        "USER_ONBOARDING_COMPLETE",
        {
          user_role: user.role,
          email: user.email,
          user_id: user.id,
          status: "SUCCESS"
        }
      )
    }).catch((error) => {
      console.log(error);
    })

    router.replace(`/${workspaces[0].slug}`);
  };

  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  useEffect(() => {
    const handleStepChange = async () => {
      if (!user || !invitations) return;

      const onboardingStep = user.onboarding_step;

      if (!onboardingStep.workspace_join && !onboardingStep.workspace_create && workspaces && workspaces?.length > 0) {
        await updateCurrentUser({
          onboarding_step: {
            ...user.onboarding_step,
            workspace_join: true,
            workspace_create: true,
          },
          last_workspace_id: workspaces[0].id,
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
  }, [user, invitations, step]);

  return (
    <>
      <SwitchOrDeleteAccountModal isOpen={showDeleteAccountModal} onClose={() => setShowDeleteAccountModal(false)} />
      {user && step !== null ? (
        <div className={`bg-onboarding-gradient-100 h-full flex flex-col fixed w-full`}>
          <div className="sm:pt-14 sm:pb-8 py-10 px-4 sm:px-7 md:px-14 lg:pl-28 lg:pr-24 flex items-center">
            <div className="w-full flex items-center justify-between font-semibold ">
              <div className="text-3xl flex items-center gap-x-1">
                <Image src={BluePlaneLogoWithoutText} alt="Plane Logo" height={30} width={30} />
                Plane
              </div>

              <div>
                <Controller
                  control={control}
                  name="full_name"
                  render={({ field: { value } }) => (
                    <div className="pr-4 flex gap-x-2 items-center">
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
                          <p className="text-sm text-custom-text-200 font-medium">
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
                                  className="hover:cursor-pointer bg-onboarding-background-200 mr-auto mt-2 rounded-md font-normal text-red-400 text-base p-3 shadow-sm border border-red-400"
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
          <div className="w-full h-full lg:w-4/5 xl:w-3/4 bg-onboarding-gradient-100 pt-4 px-4 sm:w-4/5 rounded-t-md mx-auto shadow-sm border-x border-t border-custom-border-200 overflow-auto">
            <div className={`h-full w-full bg-onboarding-gradient-200 rounded-t-md overflow-auto`}>
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
                  workspace={workspaces?.[0]}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-screen w-full grid place-items-center">
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
