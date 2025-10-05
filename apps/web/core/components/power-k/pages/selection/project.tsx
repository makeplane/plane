"use client";

import React from "react";
import { Command } from "cmdk";
import { FolderKanban } from "lucide-react";
import type { TSelectionPageProps } from "../../core/types";

// Mock projects - in real implementation, this would come from the store
const MOCK_PROJECTS = [
  { id: "proj-1", name: "Plane Web", identifier: "PLANE" },
  { id: "proj-2", name: "Mobile App", identifier: "MOBILE" },
  { id: "proj-3", name: "API Development", identifier: "API" },
];

export function SelectProjectPage({ workspaceSlug, onSelect }: TSelectionPageProps) {
  return (
    <>
      {MOCK_PROJECTS.map((project) => (
        <Command.Item
          key={project.id}
          value={`${project.name} ${project.identifier}`}
          onSelect={() => onSelect(project.id)}
          className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-custom-background-80 aria-selected:bg-custom-background-80"
        >
          <FolderKanban className="h-4 w-4 flex-shrink-0 text-custom-text-300" />
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-custom-text-100">{project.name}</span>
            <span className="text-xs text-custom-text-400">{project.identifier}</span>
          </div>
        </Command.Item>
      ))}
      {MOCK_PROJECTS.length === 0 && (
        <div className="py-8 text-center text-sm text-custom-text-400">No projects found</div>
      )}
    </>
  );
}
