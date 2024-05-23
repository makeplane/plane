import React from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// hooks
import { Pencil, Trash2 } from "lucide-react";
import { IEstimate } from "@plane/types";
import { Button, CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
import { orderArrayBy } from "@/helpers/array.helper";
import { useProject } from "@/hooks/store";
// ui
//icons
// helpers
// types

type Props = {
  estimate: IEstimate;
  editEstimate: (estimate: IEstimate) => void;
  deleteEstimate: (estimateId: string) => void;
};

export const EstimateListItem: React.FC<Props> = observer((props) => {
  const { estimate, editEstimate, deleteEstimate } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { currentProjectDetails, updateProject } = useProject();

  const handleUseEstimate = async () => {
    if (!workspaceSlug || !projectId) return;

    await updateProject(workspaceSlug.toString(), projectId.toString(), {
      estimate: estimate.id,
    }).catch((err) => {
      const error = err?.error;
      const errorString = Array.isArray(error) ? error[0] : error;

      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: errorString ?? "Estimate points could not be used. Please try again.",
      });
    });
  };

  return (
    <>
      <div className="gap-2 border-b border-custom-border-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h6 className="flex w-[40vw] items-center gap-2 truncate text-sm font-medium">
              {estimate.name}
              {currentProjectDetails?.estimate && currentProjectDetails?.estimate === estimate.id && (
                <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-500">In use</span>
              )}
            </h6>
            <p className="font-sm w-[40vw] truncate text-[14px] font-normal text-custom-text-200">
              {estimate.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {currentProjectDetails?.estimate !== estimate?.id && estimate?.points?.length > 0 && (
              <Button variant="neutral-primary" onClick={handleUseEstimate} size="sm">
                Use
              </Button>
            )}
            <CustomMenu ellipsis>
              <CustomMenu.MenuItem
                onClick={() => {
                  editEstimate(estimate);
                }}
              >
                <div className="flex items-center justify-start gap-2">
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit estimate</span>
                </div>
              </CustomMenu.MenuItem>
              {currentProjectDetails?.estimate !== estimate.id && (
                <CustomMenu.MenuItem
                  onClick={() => {
                    deleteEstimate(estimate.id);
                  }}
                >
                  <div className="flex items-center justify-start gap-2">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete estimate</span>
                  </div>
                </CustomMenu.MenuItem>
              )}
            </CustomMenu>
          </div>
        </div>
        {estimate?.points?.length > 0 ? (
          <div className="flex text-xs text-custom-text-200">
            Estimate points (
            <span className="flex gap-1">
              {orderArrayBy(estimate.points, "key").map((point, index) => (
                <h6 key={point.id} className="text-custom-text-200">
                  {point.value}
                  {index !== estimate.points.length - 1 && ","}{" "}
                </h6>
              ))}
            </span>
            )
          </div>
        ) : (
          <div>
            <p className="text-xs text-custom-text-200">No estimate points</p>
          </div>
        )}
      </div>
    </>
  );
});
