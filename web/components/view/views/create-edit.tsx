import { FC, ReactNode, useState } from "react";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// ui
import { Button } from "@plane/ui";
// components
import { ViewCreateEditForm } from "./create-edit-form";
// constants
import { viewLocalPayload } from "constants/view";
// types
import { TViewOperations } from "../types";
import { TView, TViewFilters, TViewTypes } from "@plane/types";

type TViewCreateEdit = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string | undefined;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
  children?: ReactNode;
};

export const ViewCreateEdit: FC<TViewCreateEdit> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewOperations, children } = props;
  // states
  const [currentViewId, setCurrentViewId] = useState<string>();
  const [currentFilters, setCurrentFilters] = useState<Partial<TViewFilters>>({});
  const [modalToggle, setModalToggle] = useState(false);

  const handleModalOpen = () => {
    if (viewId === undefined) {
      const viewPayload = viewLocalPayload;
      setCurrentViewId(viewPayload.id);
      viewOperations?.localViewCreate(viewPayload as TView);
    } else {
      setCurrentViewId(viewId);
    }
    setModalToggle(true);
  };

  const handleModalClose = () => {
    if (viewId === undefined) {
      if (currentViewId) viewOperations?.clearLocalView(currentViewId);
    } else {
    }
    setModalToggle(false);
    setCurrentViewId(undefined);
    setCurrentFilters({});
  };

  const onSubmit = async (viewData: Partial<TView>) => {
    if (!viewData?.name) return;
    try {
      await viewOperations.create(viewData);
      handleModalClose();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {currentViewId && (
        <ViewCreateEditForm
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          viewId={currentViewId}
          viewType={viewType}
          viewOperations={viewOperations}
          onSubmit={onSubmit}
          modalToggle={modalToggle}
          handleModalClose={handleModalClose}
        />
      )}

      <div className="inline-block" onClick={handleModalOpen}>
        {children ? (
          children
        ) : (
          <Button size="sm" className="flex justify-center items-center">
            <Plus size={12} />
            <span>New View</span>
          </Button>
        )}
      </div>
    </>
  );
});
