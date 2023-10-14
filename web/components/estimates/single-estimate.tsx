import React, { useState } from "react";

import { useRouter } from "next/router";

// services
import { ProjectService } from "services/project";
// hooks
import useToast from "hooks/use-toast";
import useProjectDetails from "hooks/use-project-details";
// components
import { DeleteEstimateModal } from "components/estimates";
// ui
import { Button } from "@plane/ui";
import { CustomMenu } from "components/ui";
//icons
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { IUser, IEstimate } from "types";

type Props = {
  user: IUser | undefined;
  estimate: IEstimate;
  editEstimate: (estimate: IEstimate) => void;
  handleEstimateDelete: (estimateId: string) => void;
};

// services
const projectService = new ProjectService();

export const SingleEstimate: React.FC<Props> = ({ user, estimate, editEstimate, handleEstimateDelete }) => {
  const [isDeleteEstimateModalOpen, setIsDeleteEstimateModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { projectDetails, mutateProjectDetails } = useProjectDetails();

  const handleUseEstimate = async () => {
    if (!workspaceSlug || !projectId) return;

    const payload = {
      estimate: estimate.id,
    };

    mutateProjectDetails((prevData: any) => {
      if (!prevData) return prevData;

      return { ...prevData, estimate: estimate.id };
    }, false);

    await projectService.updateProject(workspaceSlug as string, projectId as string, payload, user).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Estimate points could not be used. Please try again.",
      });
    });
  };

  return (
    <>
      <div className="gap-2 p-4 border-b border-custom-border-200">
        <div className="flex items-center justify-between">
          <div>
            <h6 className="flex w-[40vw] items-center gap-2 truncate text-sm font-medium">
              {estimate.name}
              {projectDetails?.estimate && projectDetails?.estimate === estimate.id && (
                <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-500">In use</span>
              )}
            </h6>
            <p className="font-sm w-[40vw] truncate text-[14px] font-normal text-custom-text-200">
              {estimate.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {projectDetails?.estimate !== estimate.id && estimate.points.length > 0 && (
              <Button variant="neutral-primary" onClick={handleUseEstimate}>
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
                  <PencilIcon className="h-3.5 w-3.5" />
                  <span>Edit estimate</span>
                </div>
              </CustomMenu.MenuItem>
              {projectDetails?.estimate !== estimate.id && (
                <CustomMenu.MenuItem
                  onClick={() => {
                    setIsDeleteEstimateModalOpen(true);
                  }}
                >
                  <div className="flex items-center justify-start gap-2">
                    <TrashIcon className="h-3.5 w-3.5" />
                    <span>Delete estimate</span>
                  </div>
                </CustomMenu.MenuItem>
              )}
            </CustomMenu>
          </div>
        </div>
        {estimate.points.length > 0 ? (
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

      <DeleteEstimateModal
        isOpen={isDeleteEstimateModalOpen}
        handleClose={() => setIsDeleteEstimateModalOpen(false)}
        data={estimate}
        handleDelete={() => {
          handleEstimateDelete(estimate.id);
          setIsDeleteEstimateModalOpen(false);
        }}
      />
    </>
  );
};
