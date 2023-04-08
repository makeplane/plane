import React, { useState } from "react";

// ui
import { CustomMenu, PrimaryButton } from "components/ui";
// types
import { IEstimate, IProject } from "types";
//icons
import { PencilIcon, TrashIcon, SquaresPlusIcon, ListBulletIcon  } from "@heroicons/react/24/outline";

import useSWR, { mutate } from "swr";

import useToast from "hooks/use-toast";

import estimatesService from "services/estimates.service";
import projectService from "services/project.service";

import { EstimatePointsModal } from "./estimate-points-modal";
import { useRouter } from "next/router";

import { ESTIMATE_POINTS_LIST } from "constants/fetch-keys";
import { PlusIcon } from "components/icons";

interface IEstimatePoints {
  key: string;
  value: string;
}

type Props = {
  estimate: IEstimate;
  editEstimate: (estimate: IEstimate) => void;
  handleEstimateDelete: (estimateId: string) => void;
  activeEstimate: IEstimate | null;
  setActiveEstimate: React.Dispatch<React.SetStateAction<IEstimate | null>>;
};

export const SingleEstimate: React.FC<Props> = ({
  estimate,
  editEstimate,
  handleEstimateDelete,
  activeEstimate,
  setActiveEstimate,
}) => {
  const [isEstimatePointsModalOpen, setIsEstimatePointsModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

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

  const handleActiveEstimate = async () => {
    if (!workspaceSlug || !projectId || !estimate) return;
    const payload: Partial<IProject> = {
      estimate: estimate.id,
    };
    setActiveEstimate(estimate);
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
    <div className="divide-y">
      <EstimatePointsModal
        isOpen={isEstimatePointsModalOpen}
        estimate={estimate}
        onClose={() => setIsEstimatePointsModalOpen(false)}
      />
      <div className="gap-2 space-y-3 my-3 bg-white">
        <div className="flex justify-between items-center">
          <div className="items-start">
            <h6 className="font-medium text-base w-[40vw] truncate">{estimate.name}</h6>
            <p className="font-sm text-gray-400 font-normal text-[14px] w-[40vw] truncate">
              {estimate.description}
            </p>
          </div>
          <div className="flex items-center gap-8">
            <CustomMenu ellipsis>
              <CustomMenu.MenuItem onClick={handleActiveEstimate}>
                <span className="flex items-center justify-start gap-2">
                  <SquaresPlusIcon className="h-4 w-4" />
                  <span>Use estimate</span>
                </span>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={() => setIsEstimatePointsModalOpen(true)}>
                <span className="flex items-center justify-start gap-2">
                  <ListBulletIcon className="h-4 w-4" />
                  {estimatePoints?.length === 8 ? "Update points" : "Create points"}
                </span>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem
                onClick={() => {
                  editEstimate(estimate);
                }}
              >
                <span className="flex items-center justify-start gap-2">
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit estimate</span>
                </span>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem
                onClick={() => {
                  handleEstimateDelete(estimate.id);
                }}
              >
                <span className="flex items-center justify-start gap-2">
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete estimate</span>
                </span>
              </CustomMenu.MenuItem>
            </CustomMenu>
          </div>
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
              <p className= " text-sm text-gray-300">No estimate points</p>
            </div>
        )}
      </div>
    </div>
  );
};
