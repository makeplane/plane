import { useState } from "react";

// ui
import { SecondaryButton } from "components/ui";
// types
import { ICurrentUserResponse, OnboardingSteps } from "types";
// constants
import { CreateWorkspaceForm } from "components/workspace";

type Props = {
  user: ICurrentUserResponse | undefined;
  updateLastWorkspace: () => Promise<void>;
  stepChange: (steps: Partial<OnboardingSteps>) => Promise<void>;
};

export const Workspace: React.FC<Props> = ({ user, updateLastWorkspace, stepChange }) => {
  const [defaultValues, setDefaultValues] = useState({
    name: "",
    slug: "",
    organization_size: "",
  });

  const completeStep = async () => {
    if (!user) return;

    await stepChange({
      workspace_create: true,
    });
    await updateLastWorkspace();
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
            <SecondaryButton onClick={() => stepChange({ profile_complete: false })}>
              Back
            </SecondaryButton>
          }
        />
      </div>
    </div>
  );
};
