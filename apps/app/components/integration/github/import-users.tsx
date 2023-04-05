import { FC } from "react";

import { useRouter } from "next/router";

// react-hook-form
import { UseFormWatch } from "react-hook-form";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";
// types
import {
  IUserDetails,
  SingleUserSelect,
  TFormValues,
  TIntegrationSteps,
} from "components/integration";

type Props = {
  handleStepChange: (value: TIntegrationSteps) => void;
  users: IUserDetails[];
  setUsers: React.Dispatch<React.SetStateAction<IUserDetails[]>>;
  watch: UseFormWatch<TFormValues>;
};

export const GithubImportUsers: FC<Props> = ({ handleStepChange, users, setUsers, watch }) => {
  const router = useRouter();

  const isInvalid = users.filter((u) => u.import !== false && u.email === "").length > 0;

  return (
    <div className="mt-6">
      <div>
        <div className="grid grid-cols-3 gap-2 text-sm mb-2 font-medium">
          <div>Name</div>
          <div>Import as...</div>
          <div className="text-right">
            {users.filter((u) => u.import !== false).length} users selected
          </div>
        </div>
        <div className="space-y-2">
          {watch("collaborators").map((collaborator, index) => (
            <SingleUserSelect
              key={collaborator.id}
              collaborator={collaborator}
              index={index}
              users={users}
              setUsers={setUsers}
            />
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2">
        <SecondaryButton onClick={() => handleStepChange("repo-details")}>Back</SecondaryButton>
        <PrimaryButton onClick={() => handleStepChange("import-confirm")} disabled={isInvalid}>
          Next
        </PrimaryButton>
      </div>
    </div>
  );
};
