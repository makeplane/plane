import { FC } from "react";
// types
import { ICycle } from "types";
// components
import { CyclesBoardCard } from "components/cycles";

export interface ICyclesBoard {
  cycles: ICycle[];
  filter: string;
  workspaceSlug: string;
  projectId: string;
}

export const CyclesBoard: FC<ICyclesBoard> = (props) => {
  const { cycles, filter, workspaceSlug, projectId } = props;

  return (
    <div className="grid grid-cols-1 gap-9 lg:grid-cols-2 xl:grid-cols-3">
      {cycles.length > 0 ? (
        <>
          {cycles.map((cycle) => (
            <CyclesBoardCard key={cycle.id} workspaceSlug={workspaceSlug} projectId={projectId} cycle={cycle} />
          ))}
        </>
      ) : (
        <div className="h-full grid place-items-center text-center">
          <div className="space-y-2">
            <div className="mx-auto flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="66" height="66" viewBox="0 0 66 66" fill="none">
                <circle cx="34.375" cy="34.375" r="22" stroke="rgb(var(--color-text-400))" strokeLinecap="round" />
                <path
                  d="M36.4375 20.9919C36.4375 19.2528 37.6796 17.8127 39.1709 18.1419C40.125 18.3526 41.0604 18.6735 41.9625 19.1014C43.7141 19.9322 45.3057 21.1499 46.6464 22.685C47.987 24.2202 49.0505 26.0426 49.776 28.0484C50.5016 30.0541 50.875 32.2038 50.875 34.3748C50.875 36.5458 50.5016 38.6956 49.776 40.7013C49.0505 42.7071 47.987 44.5295 46.6464 46.0647C45.3057 47.5998 43.7141 48.8175 41.9625 49.6483C41.0604 50.0762 40.125 50.3971 39.1709 50.6077C37.6796 50.937 36.4375 49.4969 36.4375 47.7578L36.4375 20.9919Z"
                  fill="rgb(var(--color-text-400))"
                />
              </svg>
            </div>
            <h4 className="text-sm text-custom-text-200">{filter === "all" ? "No cycles" : `No ${filter} cycles`}</h4>
            <button
              type="button"
              className="text-custom-primary-100 text-sm outline-none"
              onClick={() => {
                const e = new KeyboardEvent("keydown", {
                  key: "q",
                });
                document.dispatchEvent(e);
              }}
            >
              Create a new cycle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
