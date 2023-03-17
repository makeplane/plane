import { FC } from "react";
// types
import { IIntegrationData } from "components/integration";

type Props = { state: IIntegrationData; handleState: (key: string, valve: any) => void };

export const GithubImportData: FC<Props> = ({ state, handleState }) => (
  <div>
    <div>Import Data</div>
    <div className="mt-5 flex items-center justify-between">
      <button
        type="button"
        className={`rounded-sm bg-gray-300 px-3 py-1.5 text-sm transition-colors hover:bg-opacity-80`}
        onClick={() => handleState("state", "import-configure")}
      >
        Back
      </button>
      <button
        type="button"
        className={`rounded-sm bg-theme px-3 py-1.5 text-sm text-white transition-colors hover:bg-opacity-80`}
        onClick={() => handleState("state", "migrate-issues")}
      >
        Next
      </button>
    </div>
  </div>
);
