import { FC, useState } from "react";
import { Plus } from "lucide-react";
// ui
import { Button } from "@plane/ui";
// components
import { ViewCreateEditForm } from "./create-edit-form";
// types
import { TViewOperations } from "../types";
import { TViewTypes } from "@plane/types";

type TViewCreateEdit = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string | undefined;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
};

export const ViewCreateEdit: FC<TViewCreateEdit> = (props) => {
  const { workspaceSlug, projectId, viewId, viewOperations } = props;
  // states
  const [modalToggle, setModalToggle] = useState(false);

  const handleModalOpen = () => setModalToggle(true);
  const handleModalClose = () => setModalToggle(false);

  const createView = () => {
    viewOperations?.create({ name: "create" });
  };

  return (
    <>
      <ViewCreateEditForm modalToggle={modalToggle} handleModalClose={handleModalClose} />
      <div className="border border-red-500 p-5">
        <Button size="sm" className="flex justify-center items-center" onClick={createView}>
          <Plus size={12} />
          <span>New View</span>
        </Button>
      </div>
    </>
  );
};
