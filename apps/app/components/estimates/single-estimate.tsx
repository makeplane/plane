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
import { EstimatePointsModal, DeleteEstimateModal } from "components/estimates";
// ui
import { CustomMenu } from "components/ui";
//icons
import {
  PencilIcon,
  TrashIcon,
  SquaresPlusIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { IEstimate } from "types";
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
  const [isDeleteEstimateModalOpen, setIsDeleteEstimateModalOpen] = useState(false);

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
        data={estimatePoints ? orderArrayBy(estimatePoints, "key") : undefined}
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
            {projectDetails?.estimate !== estimate.id &&
              estimatePoints &&
              estimatePoints.length > 0 && (
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
                <span>
                  {estimatePoints && estimatePoints?.length > 0 ? "Edit points" : "Create points"}
                </span>
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
        {estimatePoints && estimatePoints.length > 0 ? (
          <div className="flex text-sm text-gray-400">
            Estimate points (
            <span className="flex gap-1">
              {estimatePoints.map((point, index) => (
                <h6 key={point.id}>
                  {point.value}
                  {index !== estimatePoints.length - 1 && ","}{" "}
                </h6>
              ))}
            </span>
            )
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-400">No estimate points</p>
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
