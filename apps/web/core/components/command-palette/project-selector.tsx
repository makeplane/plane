"use client";

import React from "react";
import type { TPartialProject } from "@/plane-web/types";
import { CommandPaletteEntityList } from "./entity-list";

interface Props {
  projects: TPartialProject[];
  onSelect: (project: TPartialProject) => void;
}

export const CommandPaletteProjectSelector: React.FC<Props> = ({ projects, onSelect }) => (
  <CommandPaletteEntityList
    heading="Projects"
    items={projects}
    getKey={(project) => project.id}
    getLabel={(project) => project.name}
    onSelect={onSelect}
    emptyText="No projects found"
  />
);
