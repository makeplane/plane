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
    organization_size: "",
  });

  return (
    <div className="w-full space-y-10">
      <h4 className="text-2xl font-semibold">Create your workspace</h4>
      <div className="sm:w-3/4 md:w-2/5">
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
  );
};
