/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
// ui
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalWidth, EModalPosition, Input, ModalCore } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

type DeleteTeamspaceModal = {
  isModalOpen: boolean;
  teamspaceId: string;
  onClose: () => void;
};

export function DeleteTeamspaceModal(props: DeleteTeamspaceModal) {
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
          <span className="place-items-center rounded-full bg-danger-subtle p-3">
            <AlertTriangle className="size-6 text-danger-primary" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-h5-medium 2xl:text-h4-medium">Delete teamspace</h3>
          </span>
        </div>
        <span>
          <p className="text-body-xs-regular leading-5 text-secondary">
            Are you sure you want to delete teamspace{" "}
            <span className="break-words font-semibold">{teamspace?.name}</span>? All of the data related to the
            teamspace will be permanently removed. This action cannot be undone
          </p>
        </span>
        <div className="text-secondary">
          <p className="break-words text-body-xs-regular ">
            Enter the teamspace name <span className="font-medium text-primary">{teamspace?.name}</span> to continue:
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
        <div className="text-secondary">
          <p className="text-body-xs-regular">
            To confirm, type <span className="font-medium text-primary">delete my teamspace</span> below:
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
          <Button variant="secondary" size="lg" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="error-fill" size="lg" type="submit" disabled={!isDeletionAllowed} loading={isSubmitting}>
            {isSubmitting ? "Deleting" : "Delete teamspace"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
