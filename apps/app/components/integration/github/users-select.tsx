import { FC } from "react";
// types
import { IIntegrationData } from "components/integration";

type Props = { state: IIntegrationData; handleState: (key: string, valve: any) => void };

export const GithubUsersSelect: FC<Props> = ({ state, handleState }) => (
  <div>
    <div>Users Select</div>
    <div className="mt-5 flex items-center justify-between">
      <button
        type="button"
        className={`rounded-sm bg-gray-300 px-3 py-1.5 text-sm transition-colors hover:bg-opacity-80`}
        onClick={() => handleState("state", "migrate-issues")}
      >
        Back
      </button>
      <button
        type="button"
        className={`rounded-sm bg-theme px-3 py-1.5 text-sm text-white transition-colors hover:bg-opacity-80`}
        onClick={() => handleState("state", "migrate-confirm")}
      >
        Next
      </button>
    </div>
  </div>
);
