import { FC } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
// services
import workspaceService from "services/workspace.service";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";
// types
import { SingleUserSelect, TFormValues, TIntegrationSteps } from "components/integration";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";

type Props = {
  handleStepChange: (value: TIntegrationSteps) => void;
  watch: UseFormWatch<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
};

export const GithubImportUsers: FC<Props> = ({ handleStepChange, watch, setValue }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div className="mt-6">
      <div>
        <div className="grid grid-cols-3 gap-2 text-sm mb-2">
          <div>Name</div>
          <div>Import as...</div>
          <div className="text-right">{watch("collaborators").length} users selected</div>
        </div>
        <div className="space-y-2">
          {watch("collaborators").map((collaborator, index) => (
            <SingleUserSelect
              key={collaborator.id}
              collaborator={collaborator}
              index={index}
              watch={watch}
              setValue={setValue}
            />
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2">
        <SecondaryButton onClick={() => handleStepChange("repo-details")}>Back</SecondaryButton>
        <PrimaryButton type="submit">Next</PrimaryButton>
      </div>
    </div>
  );
};
