"use client";

import type { FC } from "react";
import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";

import type { TContextMenuItem } from "@plane/ui";

import { WorkspaceDraftIssueQuickActions } from "@/components/issues/workspace-draft/quick-action";
import { EditOppositionTeamModal } from "./opposition-team-form";

interface Team {
  name: string;
  address: string;
  logo: string;
  athletic_email: string;
  athletic_phone: string;
  athletic_coach_name: string;
  asst_coach_name: string;
  asst_athletic_email: string;
  asst_athletic_phone: string;
}


type Props = {
  workspaceSlug: string;
  team: Team;          // <-- Add team data here
  issueId: number;
  onDelete?: (index: number) => void;
};

export const OppositionTeamBlock: FC<Props> = observer(
  ({ workspaceSlug, team, issueId, onDelete }) => {

    const issueRef = useRef<HTMLDivElement | null>(null);

    const [isEditOpen, setIsEditOpen] = useState(false);

    const MENU_ITEMS: TContextMenuItem[] = [
      {
        key: "edit",
        title: "Edit",
        icon: Pencil,
        action: () => setIsEditOpen(true), // <-- FIXED
      },
      {
        key: "delete",
        title: "Delete",
        icon: Trash2,
        action: () => ({}), // <-- FIXED
      },
    ];

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
      </div>
    );
  }
);
