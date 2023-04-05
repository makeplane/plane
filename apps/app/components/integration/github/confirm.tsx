import { FC } from "react";
// types
import { IIntegrationData, TIntegrationSteps } from "components/integration";

type Props = {
  handleStepChange: (value: TIntegrationSteps) => void;
};

export const GithubConfirm: FC<Props> = ({ handleStepChange }) => (
  <>
    <div>Confirm</div>
    <div className="mt-5 flex items-center justify-between">
      <button
        type="button"
        className={`rounded-sm bg-gray-300 px-3 py-1.5 text-sm transition-colors hover:bg-opacity-80`}
        onClick={() => handleStepChange("import-users")}
      >
        Back
      </button>
      <button
        type="button"
        className={`rounded-sm bg-theme px-3 py-1.5 text-sm text-white transition-colors hover:bg-opacity-80`}
        onClick={() => handleStepChange("import-confirm")}
      >
        Next
      </button>
    </div>
  </>
);
