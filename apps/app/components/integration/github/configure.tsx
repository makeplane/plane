import { FC } from "react";
// types
import { IIntegrationData } from "components/integration";

type Props = { state: IIntegrationData; handleState: (key: string, valve: any) => void };

export const GithubConfigure: FC<Props> = ({ state, handleState }) => {
  console.log("Hello", "hello");

  return (
    <div>
      <div>
        <button
          type="button"
          className={`rounded-sm bg-theme px-3 py-1.5 text-sm text-white transition-colors hover:bg-opacity-80`}
        >
          Connect to GitHub
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          className={`rounded-sm bg-gray-300 px-3 py-1.5 text-sm transition-colors hover:bg-opacity-80`}
          onClick={() => handleState("state", "import-select-source")}
        >
          Back
        </button>
        <button
          type="button"
          className={`rounded-sm bg-theme px-3 py-1.5 text-sm text-white transition-colors hover:bg-opacity-80`}
          onClick={() => handleState("state", "import-import-data")}
        >
          Next
        </button>
      </div>
    </div>
  );
};
