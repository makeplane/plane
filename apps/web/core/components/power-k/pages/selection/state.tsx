"use client";

import React from "react";
import { Command } from "cmdk";
import { Circle } from "lucide-react";
import type { TSelectionPageProps } from "../../core/types";

// Mock states - in real implementation, this would come from the store
const MOCK_STATES = [
  { id: "backlog", name: "Backlog", color: "#94a3b8" },
  { id: "todo", name: "Todo", color: "#3b82f6" },
  { id: "in-progress", name: "In Progress", color: "#f59e0b" },
  { id: "in-review", name: "In Review", color: "#8b5cf6" },
  { id: "done", name: "Done", color: "#10b981" },
];

export function SelectStatePage({ onSelect }: TSelectionPageProps) {
  return (
    <>
      {MOCK_STATES.map((state) => (
        <Command.Item
          key={state.id}
          value={state.name}
          onSelect={() => onSelect(state.id)}
          className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-custom-background-80 aria-selected:bg-custom-background-80"
        >
          <Circle className="h-3 w-3" style={{ color: state.color }} />
          <span className="text-custom-text-100">{state.name}</span>
        </Command.Item>
      ))}
    </>
  );
}
