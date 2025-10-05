"use client";

import React from "react";
import type { TPartialProject } from "@/plane-web/types";
import { PowerKMenuBuilder } from "./builder";

type Props = {
  projects: TPartialProject[];
  onSelect: (project: TPartialProject) => void;
};

export const PowerKProjectsMenu: React.FC<Props> = ({ projects, onSelect }) => (
  <PowerKMenuBuilder
    heading="Projects"
    items={projects}
    getKey={(project) => project.id}
    getLabel={(project) => project.name}
    onSelect={onSelect}
    emptyText="No projects found"
  />
);
