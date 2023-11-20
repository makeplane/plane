import React from "react";
// hooks
import useUser from "hooks/use-user";
// components
import Invitations from "./invitations";
import DummySidebar from "components/account/sidebar";
import OnboardingStepIndicator from "components/account/step-indicator";
import { Workspace } from "./workspace";
// types
import { IWorkspaceMemberInvitation, TOnboardingSteps } from "types";
// fetch-keys
import { USER_WORKSPACES, USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";
import { trackEvent } from "helpers/event-tracker.helper";

type Props = {
  finishOnboarding: () => Promise<void>;
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  setTryDiffAccount: () => void;
};

export const JoinWorkspaces: React.FC<Props> = ({ stepChange, setTryDiffAccount }) => {
  const { user } = useUser();
  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<IWorkspace>({
    defaultValues: {
      name: "",
      slug: `${window.location.host}/`,
    },
    mode: "onChange",
  });

  const handleNextStep = async () => {
    if (!user) return;

    await stepChange({ workspace_join: true });

    if (user.onboarding_step.workspace_create && user.onboarding_step.workspace_invite) await finishOnboarding();
  };

  const submitInvitations = async () => {
    if (invitationsRespond.length <= 0) return;

    setIsJoiningWorkspaces(true);

    await workspaceService
      .joinWorkspaces({ invitations: invitationsRespond })
      .then(async (res) => {
        trackEvent(
          'WORKSPACE_USER_INVITE_ACCEPT',
          res
        )
        await mutateInvitations();
        await mutate(USER_WORKSPACES);
        await updateLastWorkspace();

        await handleNextStep();
      })
      .finally(() => setIsJoiningWorkspaces(false));
  };

  return (
    <div className="w-full space-y-7 sm:space-y-10">
      <h5 className="sm:text-lg">We see that someone has invited you to</h5>
      <h4 className="text-xl sm:text-2xl font-semibold">Join a workspace</h4>
      <div className="max-h-[37vh] overflow-y-auto md:w-3/5 space-y-4">
        {invitations &&
          invitations.map((invitation) => {
            const isSelected = invitationsRespond.includes(invitation.id);

            return (
              <div
                key={invitation.id}
                className={`flex cursor-pointer items-center gap-2 border py-5 px-3.5 rounded ${isSelected ? "border-custom-primary-100" : "border-custom-border-200 hover:bg-custom-background-80"
                  }`}
                onClick={() => handleInvitation(invitation, isSelected ? "withdraw" : "accepted")}
              >
                <div className="flex-shrink-0">
                  <div className="grid place-items-center h-9 w-9 rounded">
                    {invitation.workspace.logo && invitation.workspace.logo !== "" ? (
                      <img
                        src={invitation.workspace.logo}
                        height="100%"
                        width="100%"
                        className="rounded"
                        alt={invitation.workspace.name}
                      />
                    ) : (
                      <span className="grid place-items-center h-9 w-9 py-1.5 px-3 rounded bg-gray-700 uppercase text-white">
                        {invitation.workspace.name[0]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{truncateText(invitation.workspace.name, 30)}</div>
                  <p className="text-xs text-custom-text-200">{ROLE[invitation.role]}</p>
                </div>
                <span className={`flex-shrink-0 ${isSelected ? "text-custom-primary-100" : "text-custom-text-200"}`}>
                  <CheckCircle className="h-5 w-5" />
                </span>
              </div>
            );
          })}
      </div>

      <div className="w-full lg:w-1/2 md:w-4/5 md:px-0 px-7  my-16 mx-auto">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-onboarding-text-200 text-xl sm:text-2xl">What will your workspace </p>
          <OnboardingStepIndicator step={1} />
        </div>
        <Workspace
          stepChange={stepChange}
          user={user}
          control={control}
          handleSubmit={handleSubmit}
          setValue={setValue}
          errors={errors}
          isSubmitting={isSubmitting}
        />
        <div className="flex  md:w-4/5 items-center my-8">
          <hr className="border-onboarding-border-100 w-full" />
          <p className="text-center text-sm text-custom-text-400 mx-3 flex-shrink-0">Or</p>
          <hr className="border-onboarding-border-100 w-full" />
        </div>
        <div className="w-full">
          <Invitations setTryDiffAccount={setTryDiffAccount} handleNextStep={handleNextStep} />
        </div>
      </div>
    </div>
  );
};
