"use client";

import type { FC } from "react";
import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";

import { AlertModalCore } from "@plane/ui";
import type { TContextMenuItem } from "@plane/ui";

import { WorkspaceDraftIssueQuickActions } from "@/components/issues/workspace-draft/quick-action";
import { EditOppositionTeamModal } from "./opposition-team-form";

interface Team {
  name: string;
  address: string;
  logo: string;
  athletic_email: string;
  athletic_phone: string;
  head_coach_name: string;
  asst_coach_name: string;
  asst_athletic_email: string;
  asst_athletic_phone: string;
}

type Props = {
  workspaceSlug: string;
  team: Team;
  issueId: number;            // ← used as index
  onDelete?: (index: number) => void;
};

export const OppositionTeamBlock: FC<Props> = observer(
  ({ workspaceSlug, team, issueId, onDelete }) => {

    const issueRef = useRef<HTMLDivElement | null>(null);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const MENU_ITEMS: TContextMenuItem[] = [
      {
        key: "edit",
        title: "Edit",
        icon: Pencil,
        action: () => setIsEditOpen(true),
      },
      {
        key: "delete",
        title: "Delete",
        icon: Trash2,
        action: () => setIsDeleteOpen(true),
      },
    ];

    const handleDelete = () => {
      onDelete?.(issueId);       // call parent delete
      setIsDeleteOpen(false);    // close modal
    };

    return (
      <div className="flex">

        {/* ACTION MENU */}
        <WorkspaceDraftIssueQuickActions
          parentRef={issueRef}
          MENU_ITEMS={MENU_ITEMS}
        />

        {/* EDIT MODAL */}
        {isEditOpen && (
          <EditOppositionTeamModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            team={team}
            index={issueId}
          />
        )}

        {/* DELETE CONFIRMATION MODAL */}
        <AlertModalCore
          isOpen={isDeleteOpen}
          title="Delete Opposition Team"
          content="Are you sure you want to delete this team? This action cannot be undone."
          handleClose={() => setIsDeleteOpen(false)}
          handleSubmit={handleDelete}
          isSubmitting={false}
          variant="danger"
        />
      </div>
    );
  }
);
