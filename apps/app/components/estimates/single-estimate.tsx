import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import estimatesService from "services/estimates.service";
import projectService from "services/project.service";
// hooks
import useToast from "hooks/use-toast";
import useProjectDetails from "hooks/use-project-details";
// components
import { EstimatePointsModal } from "components/estimates";
// ui
import { CustomMenu } from "components/ui";
//icons
import {
  PencilIcon,
  TrashIcon,
  SquaresPlusIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
// types
import { IEstimate, IProject } from "types";
// fetch-keys
import { ESTIMATE_POINTS_LIST } from "constants/fetch-keys";

type Props = {
  estimate: IEstimate;
  editEstimate: (estimate: IEstimate) => void;
  handleEstimateDelete: (estimateId: string) => void;
};

export const SingleEstimate: React.FC<Props> = ({
  estimate,
  editEstimate,
  handleEstimateDelete,
}) => {
  const [isEstimatePointsModalOpen, setIsEstimatePointsModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { projectDetails, mutateProjectDetails } = useProjectDetails();

  const { data: estimatePoints } = useSWR(
    workspaceSlug && projectId ? ESTIMATE_POINTS_LIST(estimate.id) : null,
    workspaceSlug && projectId
      ? () =>
          estimatesService.getEstimatesPointsList(
            workspaceSlug as string,
            projectId as string,
            estimate.id
          )
      : null
  );

  const handleUseEstimate = async () => {
    if (!workspaceSlug || !projectId) return;

    const payload = {
      estimate: estimate.id,
    };

    mutateProjectDetails((prevData) => {
      if (!prevData) return prevData;

      return { ...prevData, estimate: estimate.id };
    }, false);

    await projectService
      .updateProject(workspaceSlug as string, projectId as string, payload)
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Estimate points could not be used. Please try again.",
        });
      });
  };

  return (
    <>
      <EstimatePointsModal
        isOpen={isEstimatePointsModalOpen}
        estimate={estimate}
        onClose={() => setIsEstimatePointsModalOpen(false)}
      />
      <div className="gap-2 py-3">
        <div className="flex justify-between items-center">
          <div>
            <h6 className="flex items-center gap-2 font-medium text-base w-[40vw] truncate">
              {estimate.name}
              {projectDetails?.estimate && projectDetails?.estimate === estimate.id && (
                <span className="capitalize px-2 py-0.5 text-xs rounded bg-green-100 text-green-500">
                  In use
                </span>
              )}
            </h6>
            <p className="font-sm text-gray-400 font-normal text-[14px] w-[40vw] truncate">
              {estimate.description}
            </p>
          </div>
          <CustomMenu ellipsis>
            {projectDetails?.estimate && projectDetails?.estimate !== estimate.id && (
              <CustomMenu.MenuItem onClick={handleUseEstimate}>
                <div className="flex items-center justify-start gap-2">
                  <SquaresPlusIcon className="h-3.5 w-3.5" />
                  <span>Use estimate</span>
                </div>
              </CustomMenu.MenuItem>
            )}
            <CustomMenu.MenuItem onClick={() => setIsEstimatePointsModalOpen(true)}>
              <div className="flex items-center justify-start gap-2">
                <ListBulletIcon className="h-3.5 w-3.5" />
                <span>{estimatePoints?.length === 8 ? "Update points" : "Create points"}</span>
              </div>
            </CustomMenu.MenuItem>
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
            <CustomMenu.MenuItem
              onClick={() => {
                handleEstimateDelete(estimate.id);
              }}
            >
              <div className="flex items-center justify-start gap-2">
                <TrashIcon className="h-3.5 w-3.5" />
                <span>Delete estimate</span>
              </div>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
        {estimatePoints && estimatePoints.length > 0 ? (
          <div className="flex gap-2">
            {estimatePoints.length > 0 && "Estimate points ("}
            {estimatePoints.map((point, i) => (
              <h6 key={point.id}>
                {point.value}
                {i !== estimatePoints.length - 1 && ","}{" "}
              </h6>
            ))}
            {estimatePoints.length > 0 && ")"}
          </div>
        ) : (
          <div>
            <p className=" text-sm text-gray-300">No estimate points</p>
          </div>
        )}
      </div>
    </>
  );
};
