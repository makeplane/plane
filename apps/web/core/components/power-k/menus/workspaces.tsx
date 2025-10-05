"use client";

import React from "react";
// plane imports
import { IWorkspace } from "@plane/types";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  workspaces: IWorkspace[];
  onSelect: (workspace: IWorkspace) => void;
};

export const PowerKWorkspacesMenu: React.FC<Props> = ({ workspaces, onSelect }) => (
  <PowerKMenuBuilder
    heading="Workspaces"
    items={workspaces}
    getKey={(workspace) => workspace.id}
    getLabel={(workspace) => workspace.name}
    onSelect={onSelect}
    emptyText="No workspaces found"
  />
);
