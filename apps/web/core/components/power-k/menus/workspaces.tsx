"use client";

import React from "react";
// plane imports
import { IWorkspace } from "@plane/types";
// components
import { WorkspaceLogo } from "@/components/workspace/logo";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  workspaces: IWorkspace[];
  onSelect: (workspace: IWorkspace) => void;
};

export const PowerKWorkspacesMenu: React.FC<Props> = ({ workspaces, onSelect }) => (
  <PowerKMenuBuilder
    items={workspaces}
    getKey={(workspace) => workspace.id}
    getIconNode={(workspace) => <WorkspaceLogo logo={workspace.logo_url} name={workspace.name} classNames="shrink-0" />}
    getValue={(workspace) => workspace.name}
    getLabel={(workspace) => workspace.name}
    onSelect={onSelect}
    emptyText="No workspaces found"
  />
);
