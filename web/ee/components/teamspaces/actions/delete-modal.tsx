"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
// ui
import { Button, EModalWidth, EModalPosition, Input, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

type DeleteTeamspaceModal = {
  isModalOpen: boolean;
  teamspaceId: string;
  onClose: () => void;
};

export const DeleteTeamspaceModal: React.FC<DeleteTeamspaceModal> = (props) => {
  const { isModalOpen, teamspaceId, onClose } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug, teamspaceId: teamIdParam } = useParams();
  // states
  const [teamName, setTeamName] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletionAllowed, setIsDeletionAllowed] = useState(false);
  // plane web hooks
  const { getTeamspaceById, deleteTeamspace } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);

  useEffect(() => {
    setIsDeletionAllowed(teamName === teamspace?.name && deleteConfirmation === "delete my teamspace");
  }, [teamName, deleteConfirmation, teamspace?.name]);

  const handleClose = () => {
    setTimeout(() => {
      setTeamName("");
      setDeleteConfirmation("");
    }, 100);
    onClose();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !isDeletionAllowed || !teamspaceId) return;
    setIsSubmitting(true);
    await deleteTeamspace(workspaceSlug.toString(), teamspaceId)
      .then(() => {
        if (teamIdParam) {
          router.push(`/${workspaceSlug}/teamspaces`);
        }
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Teamspace deleted successfully.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again later.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <ModalCore isOpen={isModalOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 p-6">
        <div className="flex w-full items-center justify-start gap-4">
          <span className="place-items-center rounded-full bg-red-500/20 p-3">
            <AlertTriangle className="size-6 text-red-600" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-xl font-medium 2xl:text-2xl">Delete teamspace</h3>
          </span>
        </div>
        <span>
          <p className="text-sm leading-5 text-custom-text-200">
            Are you sure you want to delete teamspace{" "}
            <span className="break-words font-semibold">{teamspace?.name}</span>? All of the data related to the
            teamspace will be permanently removed. This action cannot be undone
          </p>
        </span>
        <div className="text-custom-text-200">
          <p className="break-words text-sm ">
            Enter the teamspace name <span className="font-medium text-custom-text-100">{teamspace?.name}</span> to
            continue:
          </p>
          <Input
            id="projectName"
            name="projectName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Teamspace name"
            className="mt-2 w-full"
            autoComplete="off"
          />
        </div>
        <div className="text-custom-text-200">
          <p className="text-sm">
            To confirm, type <span className="font-medium text-custom-text-100">delete my teamspace</span> below:
          </p>
          <Input
            id="confirmDelete"
            name="confirmDelete"
            type="text"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="Enter 'delete my teamspace'"
            className="mt-2 w-full"
            autoComplete="off"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" type="submit" disabled={!isDeletionAllowed} loading={isSubmitting}>
            {isSubmitting ? "Deleting" : "Delete teamspace"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
};
