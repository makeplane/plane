"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { IProject } from "@plane/types";
import { Button, ModalCore } from "@plane/ui";
// plane web components
import { FormEdit } from "@/plane-web/components/integrations/gitlab";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import { TGitlabEntityConnection } from "@/plane-web/types/integrations/gitlab";
// public images
import GitlabLogo from "@/public/services/gitlab.svg";

type TEntityConnectionItem = {
  project: IProject;
  entityConnection: TGitlabEntityConnection;
};

export const EntityConnectionItem: FC<TEntityConnectionItem> = observer((props) => {
  // props
  const { project, entityConnection } = props;

  // hooks
  const {
    entity: { deleteEntity },
  } = useGitlabIntegration();

  // states
  const [editModal, setEditModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteLoader, setDeleteLoader] = useState<boolean>(false);

  // handlers
  const handleEditOpen = () => setEditModal(true);

  const handleDeleteOpen = () => setDeleteModal(true);

  const handleDeleteClose = () => setDeleteModal(false);

  const handleDeleteModalSubmit = async () => {
    try {
      setDeleteLoader(true);
      await deleteEntity(entityConnection.id);
      setDeleteModal(false);
    } catch (error) {
      console.error("handleDeleteModalSubmit", error);
    } finally {
      setDeleteLoader(false);
    }
  };

  return (
    <>
      {/* entity edit */}

      {/* entity delete */}
      <ModalCore isOpen={deleteModal} handleClose={handleDeleteClose}>
        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <div className="text-xl font-medium text-custom-text-200">Remove entity</div>
            <div className="text-sm text-custom-text-300">Are you sure you want to remove this entity?</div>
          </div>
          <div className="relative flex justify-end items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={handleDeleteClose} disabled={deleteLoader}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDeleteModalSubmit}
              loading={deleteLoader}
              disabled={deleteLoader}
            >
              {deleteLoader ? "Processing" : "Continue"}
            </Button>
          </div>
        </div>
      </ModalCore>

      <FormEdit modal={editModal} handleModal={setEditModal} data={entityConnection} />

      <div className="relative flex items-center gap-2 p-2 bg-custom-background-90/20">
        <div className="flex-shrink-0 relative flex justify-center items-center w-8 h-8 rounded">
          <Image src={GitlabLogo} layout="fill" objectFit="contain" alt="Gitlab Logo" />
        </div>
        <div className="w-full">
          <div className="text-sm font-medium">
            {entityConnection?.entityData?.name} ({entityConnection?.entityData?.full_name})
          </div>
          <div className="text-xs text-custom-text-200">
            Issues are synced to <b>{project?.name || "Project"}</b>
          </div>
        </div>
        <div className="relative flex items-center gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleEditOpen}>
            Edit
          </Button>
          <Button variant="link-danger" size="sm" onClick={handleDeleteOpen}>
            Remove
          </Button>
        </div>
      </div>
    </>
  );
});
