import { useEffect, useState, ReactElement, Fragment } from "react";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { useTheme } from "next-themes";
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
import { InviteMembers, JoinWorkspaces, UserDetails, Workspace } from "components/onboarding";
// ui
import { Avatar, CustomMenu, Spinner } from "@plane/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
import BlackHorizontalLogo from "public/plane-logos/black-horizontal-with-blue-logo.svg";
import WhiteHorizontalLogo from "public/plane-logos/white-horizontal-with-blue-logo.svg";
// types
import { IUser, TOnboardingSteps } from "types";
import { NextPageWithLayout } from "types/app";
import { ChevronDown } from "lucide-react";
import { Menu, Popover, Transition } from "@headlessui/react";
import DeleteAccountModal from "components/account/delete-account-modal";

// services
const workspaceService = new WorkspaceService();

const OnboardingPage: NextPageWithLayout = observer(() => {
  const [step, setStep] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tryDiffAccount, setTryDiffAccount] = useState(false);

  const {
    user: { currentUser, updateCurrentUser, updateUserOnBoard },
    workspace: workspaceStore,
  } = useMobxStore();

  const user = currentUser ?? undefined;
  const workspaces = workspaceStore.workspaces;

  const { setTheme } = useTheme();

  const {} = useUserAuth("onboarding");

  const { data: invitations } = useSWR("USER_WORKSPACE_INVITATIONS_LIST", () =>
    workspaceService.userWorkspaceInvitations()
  );

  // update last active workspace details
  const updateLastWorkspace = async () => {
    console.log("Workspaces", workspaces);
    if (!workspaces) return;

    await updateCurrentUser({
      last_workspace_id: workspaces[0]?.id,
    });
  };

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
    if (!user) return;

    await updateUserOnBoard();
  };

  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  useEffect(() => {
    const handleStepChange = async () => {
      if (!user || !invitations) return;

      const onboardingStep = user.onboarding_step;

      if (!onboardingStep.workspace_join && !onboardingStep.workspace_create && step !== 1) setStep(1);

      if (onboardingStep.workspace_join || onboardingStep.workspace_create) {
        if (!onboardingStep.profile_complete && step!==2) setStep(2);
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
      <DeleteAccountModal
        heading={tryDiffAccount ? "Try Different Email" : "Delete Account"}
        isOpen={showDeleteModal || tryDiffAccount}
        onClose={() => {
          setShowDeleteModal(false);
          setTryDiffAccount(false);
        }}
      />
      {user && step !== null ? (
        <div className="bg-gradient-to-r from-custom-primary-10/80 to-custom-primary-20/80 h-full overflow-y-auto">
          <div className="sm:py-14 py-10 px-4 sm:px-7 md:px-14 lg:pl-28 lg:pr-24 flex items-center">
            <div className="w-full flex items-center justify-between font-semibold ">
              <div className="text-3xl flex items-center gap-x-1">
                <Image src={BluePlaneLogoWithoutText} alt="Plane Logo" height={30} width={30} />
                Plane
              </div>

              <div className="pr-4 flex gap-x-2 items-center">
                {step != 1 && (
                  <Avatar
                    name={workspaces ? workspaces[0].name : "N"}
                    size={35}
                    shape="square"
                    fallbackBackgroundColor="#FCBE1D"
                    className="!text-base"
                  />
                )}
                <div>
                  {step != 1 && <p className="text-sm text-custom-text-200 font-medium">{currentUser?.first_name}</p>}

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
                      <Menu.Items className={"absolute bg-slate-600 translate-x-full"}>
                        <Menu.Item>
                          <div
                            className="absolute pr-28 hover:cursor-pointer bg-custom-background-100 mr-auto mt-2 rounded-md text-custom-text-300 text-base font-normal p-3 shadow-sm border border-custom-border-200"
                            onClick={() => {
                              setShowDeleteModal(true);
                            }}
                          >
                            Delete
                          </div>
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-4/5 xl:w-3/4 sm:w-4/5 rounded-md mx-auto shadow-sm border border-custom-border-200">
            <div className=" bg-gradient-to-r from-custom-primary-10/80 to-custom-primary-20/30 p-4">
              <div className="bg-gradient-to-br from-white/40 to-white/80 h-full rounded-md">
                {step === 1 ? (
                  <JoinWorkspaces
                    setTryDiffAccount={() => {
                      setTryDiffAccount(true);
                    }}
                    finishOnboarding={finishOnboarding}
                    stepChange={stepChange}
                    updateLastWorkspace={updateLastWorkspace}
                  />
                ) : step === 2 ? (
                  <UserDetails user={user} />
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
