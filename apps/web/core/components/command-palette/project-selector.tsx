"use client";

import React from "react";
import { Command } from "cmdk";
import type { TPartialProject } from "@/plane-web/types";

interface Props {
  projects: TPartialProject[];
  onSelect: (project: TPartialProject) => void;
}

export const CommandPaletteProjectSelector: React.FC<Props> = ({ projects, onSelect }) => {
  if (projects.length === 0)
    return <div className="px-3 py-8 text-center text-sm text-custom-text-300">No projects found</div>;

  return (
    <Command.Group heading="Projects">
      {projects.map((project) => (
        <Command.Item
          key={project.id}
          value={project.name}
          onSelect={() => onSelect(project)}
          className="focus:outline-none"
        >
          {project.name}
        </Command.Item>
      ))}
    </Command.Group>
  );
};
