import { useState } from "react";

// ui
import { Button } from "@plane/ui";
// types
import { IUser, IWorkspace, TOnboardingSteps } from "types";
// constants
import { CreateWorkspaceForm } from "components/workspace";

type Props = {
  finishOnboarding: () => Promise<void>;
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  updateLastWorkspace: () => Promise<void>;
  user: IUser | undefined;
  workspaces: IWorkspace[] | undefined;
};

export const Workspace: React.FC<Props> = ({ finishOnboarding, stepChange, updateLastWorkspace, user, workspaces }) => {
  const [defaultValues, setDefaultValues] = useState({
    name: "",
    slug: "",
    organization_size: "",
  });

  const completeStep = async () => {
    if (!user) return;

    const payload: Partial<TOnboardingSteps> = {
      workspace_create: true,
    };

    await stepChange(payload);
    await updateLastWorkspace();
  };

  const secondaryButtonAction = async () => {
    if (workspaces && workspaces.length > 0) {
      await stepChange({ workspace_create: true, workspace_invite: true, workspace_join: true });
      await finishOnboarding();
    } else await stepChange({ profile_complete: false, workspace_join: false });
  };

  return (
    <div className="w-full space-y-7 sm:space-y-10">
      <h4 className="text-xl sm:text-2xl font-semibold">Create your workspace</h4>
      <div className="sm:w-3/4 md:w-2/5">
        <CreateWorkspaceForm
          onSubmit={completeStep}
          defaultValues={defaultValues}
          setDefaultValues={setDefaultValues}
          user={user}
          primaryButtonText={{
            loading: "Creating...",
            default: "Continue",
          }}
          secondaryButton={
            workspaces ? (
              <Button variant="neutral-primary" onClick={secondaryButtonAction}>
                {workspaces.length > 0 ? "Skip & continue" : "Back"}
              </Button>
            ) : undefined
          }
        />
      </div>
    </div>
  );
};
