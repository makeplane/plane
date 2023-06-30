import { useState } from "react";

// types
import { ICurrentUserResponse } from "types";
// constants
import { CreateWorkspaceForm } from "components/workspace";

type Props = {
  setStep: React.Dispatch<React.SetStateAction<number | null>>;
  setWorkspace: React.Dispatch<React.SetStateAction<any>>;
  user: ICurrentUserResponse | undefined;
};

export const Workspace: React.FC<Props> = ({ setStep, setWorkspace, user }) => {
  const [defaultValues, setDefaultValues] = useState({
    name: "",
    slug: "",
    company_size: null,
  });

  return (
    <div className="w-full mt-6">
      <div className="space-y-10">
        <h4 className="text-2xl font-semibold">Create your workspace</h4>
        <div className="md:w-1/3">
          <CreateWorkspaceForm
            onSubmit={(res) => {
              setWorkspace(res);
              setStep(3);
            }}
            defaultValues={defaultValues}
            setDefaultValues={setDefaultValues}
            user={user}
          />
        </div>
      </div>
    </div>
  );
};
