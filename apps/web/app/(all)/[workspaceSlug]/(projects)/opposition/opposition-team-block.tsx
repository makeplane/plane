"use client";

import type { FC } from "react";
import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";

import { AlertModalCore } from "@plane/ui";
import type { TContextMenuItem } from "@plane/ui";

import { WorkspaceDraftIssueQuickActions } from "@/components/issues/workspace-draft/quick-action";
import { useOppositionTeams } from "./(context)/opposition-teams-context";
import { updateEntity } from "./(opposition-api)/update-opposition";
import { EditOppositionTeamModal } from "./opposition-team-form";

interface Team {
  id: string;
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
};

const API_URL = `${process.env.NEXT_PUBLIC_CP_SERVER_URL}/meta-type`;

async function getOppositionTeamBlock() {
  const res = await fetch(API_URL);
  const json = await res.json();

  const list = json?.["Gateway Response"]?.result;
  if (!Array.isArray(list)) return null;

  const block = list.find(
    (item: any) => Array.isArray(item) && item.some((f: any) => f?.field === "key" && f?.value === "OPPOSITIONTEAM")
  );
  if (!block) return null;

  const getField = (key: string) => {
    const found = block.find((x: any) => x?.field === key);
    return found?.value;
  };

  return {
    id: getField("id"),
    name: getField("name"),
    key: getField("key"),
    values: getField("values") || [],
  };
}

export const OppositionTeamBlock: FC<Props> = observer(
  ({ workspaceSlug, team }) => {

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

    const { refreshTeams } = useOppositionTeams();

 const handleDelete = async () => {
  try {
    const block = await getOppositionTeamBlock();
    if (!block) {
      alert("Opposition Team meta-type missing");
      return;
    }

    if (!team?.id) {
      console.error("Team UID missing");
      return;
    }

    const updatedValues = block.values.filter(
      (t: any) => t.id !== team.id
    );

    const payload = {
      id: block.id,
      name: block.name,
      key: block.key,
      values: updatedValues,
    };

    await updateEntity("meta-type", payload);
    refreshTeams();

    setIsDeleteOpen(false);
  } catch (err) {
    console.error("Delete failed", err);
  }
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
