"use client";

import React from "react";
import { Command } from "cmdk";
import { Signal } from "lucide-react";
import type { TSelectionPageProps } from "../../core/types";

// Mock priorities - in real implementation, this would come from constants
const MOCK_PRIORITIES = [
  { id: "urgent", name: "Urgent", color: "#ef4444" },
  { id: "high", name: "High", color: "#f97316" },
  { id: "medium", name: "Medium", color: "#eab308" },
  { id: "low", name: "Low", color: "#22c55e" },
  { id: "none", name: "None", color: "#94a3b8" },
];

export function SelectPriorityPage({ onSelect }: TSelectionPageProps) {
  return (
    <>
      {MOCK_PRIORITIES.map((priority) => (
        <Command.Item
          key={priority.id}
          value={priority.name}
          onSelect={() => onSelect(priority.id)}
          className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-custom-background-80 aria-selected:bg-custom-background-80"
        >
          <Signal className="h-3 w-3" style={{ color: priority.color }} />
          <span className="text-custom-text-100">{priority.name}</span>
        </Command.Item>
      ))}
    </>
  );
}
