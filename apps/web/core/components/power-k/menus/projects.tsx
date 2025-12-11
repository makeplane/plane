import React from "react";
// components
import { Logo } from "@plane/propel/emoji-icon-picker";
// plane imports
import type { TPartialProject } from "@/plane-web/types";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  projects: TPartialProject[];
  onSelect: (project: TPartialProject) => void;
};

export function PowerKProjectsMenu({ projects, onSelect }: Props) {
  return (
    <PowerKMenuBuilder
      items={projects}
      getKey={(project) => project.id}
      getIconNode={(project) => (
        <span className="shrink-0">
          <Logo logo={project.logo_props} size={14} />
        </span>
      )}
      getValue={(project) => project.name}
      getLabel={(project) => project.name}
      onSelect={onSelect}
      emptyText="No projects found"
    />
  );
}
