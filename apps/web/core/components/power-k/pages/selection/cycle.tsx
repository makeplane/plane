"use client";

import React from "react";
import { Command } from "cmdk";
import { ContrastIcon } from "@plane/propel/icons";
import type { TSelectionPageProps } from "../../core/types";

// Mock cycles - in real implementation, this would come from the store
const MOCK_CYCLES = [
  { id: "cycle-1", name: "Sprint 24", status: "current" },
  { id: "cycle-2", name: "Sprint 25", status: "upcoming" },
  { id: "cycle-3", name: "Sprint 23", status: "completed" },
];

export function SelectCyclePage({ workspaceSlug, projectId, onSelect }: TSelectionPageProps) {
  return (
    <>
      {MOCK_CYCLES.map((cycle) => (
        <Command.Item
          key={cycle.id}
          value={cycle.name}
          onSelect={() => onSelect(cycle.id)}
          className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-custom-background-80 aria-selected:bg-custom-background-80"
        >
          <ContrastIcon className="h-4 w-4 flex-shrink-0 text-custom-text-300" />
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-custom-text-100">{cycle.name}</span>
            <span className="text-xs capitalize text-custom-text-400">{cycle.status}</span>
          </div>
        </Command.Item>
      ))}
      {MOCK_CYCLES.length === 0 && (
        <div className="py-8 text-center text-sm text-custom-text-400">No cycles found</div>
      )}
    </>
  );
}
