import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
// plane package imports
import { E_SORT_ORDER } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
// components
import { ActivitySortRoot } from "@/components/issues/issue-detail/issue-activity";
import { useProjectUpdates } from "@/plane-web/hooks/store/projects/use-project-updates";
import { TProjectUpdate } from "@/plane-web/types";
import { UpdateBlock } from "./block";
import { EmptyUpdates } from "./empty";
import { UpdatesLoader } from "./loader";
import { NewUpdate } from "./new-update";
import { useUpdates } from "./use-updates";

export const ProjectUpdates = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  // state
  const [showInput, setShowInput] = useState(false);
  const { storedValue: sortOrder, setValue: setSortOrder } = useLocalStorage<E_SORT_ORDER>(
    "project_overview_updates_sort_order",
    E_SORT_ORDER.ASC
  );
  // hooks
  const { getUpdatesByProjectId, loader } = useProjectUpdates();
  const { handleUpdateOperations } = useUpdates(workspaceSlug.toString(), projectId.toString());

  // handler
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);
  };

  // derived
  const projectUpdates = getUpdatesByProjectId(projectId.toString()) ?? [];

  const handleNewUpdate = async (data: Partial<TProjectUpdate>) => {
    try {
      await handleUpdateOperations.create(data);
      setShowInput(false);
    } catch (error) {
      console.error("error", error);
    }
  };

  const sortedProjectUpdates = useMemo(
    () => (sortOrder === E_SORT_ORDER.ASC ? [...projectUpdates].reverse() : projectUpdates),
    [sortOrder, projectUpdates]
  );

  return loader ? (
    <UpdatesLoader />
  ) : (
    <>
      {/* New Update */}
      {showInput && <NewUpdate handleClose={() => setShowInput(false)} handleCreate={handleNewUpdate} />}

      {/* No Updates */}
      {!showInput && projectUpdates.length === 0 && <EmptyUpdates handleNewUpdate={() => setShowInput(true)} />}

      {/* Add update */}
      {!showInput && projectUpdates.length !== 0 && (
        <div className="flex justify-between h-7 items-center">
          <button
            className="flex text-custom-primary-100 text-sm font-medium rounded w-fit py-1 px-2"
            onClick={() => setShowInput(true)}
          >
            <Plus size={15} className="my-auto mr-1" />
            <div>Add update</div>
          </button>
          <ActivitySortRoot
            sortOrder={sortOrder ?? E_SORT_ORDER.ASC}
            toggleSort={toggleSortOrder}
            className="flex-shrink-0"
            iconClassName="size-3"
          />
        </div>
      )}

      {/* Updates */}
      {sortedProjectUpdates.length > 0 && (
        <div className="flex flex-col gap-4 pt-3 pb-20">
          {sortedProjectUpdates.map((updateId) => (
            <UpdateBlock
              updateId={updateId}
              key={updateId}
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              handleUpdateOperations={handleUpdateOperations}
            />
          ))}
        </div>
      )}
    </>
  );
});
