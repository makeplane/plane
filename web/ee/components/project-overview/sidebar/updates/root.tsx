import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
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
  // hooks
  const { getUpdatesByProjectId, loader } = useProjectUpdates();
  const { handleUpdateOperations } = useUpdates(workspaceSlug.toString(), projectId.toString());

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
        <button
          className="flex text-custom-primary-100 text-sm font-medium rounded w-fit py-1 px-2"
          onClick={() => setShowInput(true)}
        >
          <Plus size={15} className="my-auto mr-1" />
          <div>Add update</div>
        </button>
      )}

      {/* Updates */}
      {projectUpdates.length > 0 && (
        <div className="flex flex-col gap-4 pb-20">
          {projectUpdates.map((updateId) => (
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
