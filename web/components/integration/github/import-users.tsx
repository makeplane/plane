"use client";

import { FC } from "react";

// react-hook-form
import { UseFormWatch } from "react-hook-form";
// ui
import { Button } from "@plane/ui";
// types
import { IUserDetails, SingleUserSelect, TFormValues, TIntegrationSteps } from "@/components/integration";

type Props = {
  handleStepChange: (value: TIntegrationSteps) => void;
  users: IUserDetails[];
  setUsers: React.Dispatch<React.SetStateAction<IUserDetails[]>>;
  watch: UseFormWatch<TFormValues>;
};

export const GithubImportUsers: FC<Props> = ({ handleStepChange, users, setUsers, watch }) => {
  const isInvalid = users.filter((u) => u.import !== false && u.email === "").length > 0;

  return (
    <div className="mt-6">
      <div>
        <div className="mb-2 grid grid-cols-3 gap-2 text-sm font-medium">
          <div className="text-custom-text-200">Name</div>
          <div className="text-custom-text-200">Import as...</div>
          <div className="text-right">{users.filter((u) => u.import !== false).length} users selected</div>
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
        <Button variant="neutral-primary" onClick={() => handleStepChange("repo-details")}>
          Back
        </Button>
        <Button variant="primary" onClick={() => handleStepChange("import-confirm")} disabled={isInvalid}>
          Next
        </Button>
      </div>
    </div>
  );
};
