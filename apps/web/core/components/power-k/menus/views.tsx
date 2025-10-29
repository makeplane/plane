"use client";

import React from "react";
import { observer } from "mobx-react";
import { Layers } from "lucide-react";
// plane imports
import type { IProjectView } from "@plane/types";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  views: IProjectView[];
  onSelect: (view: IProjectView) => void;
};

export const PowerKViewsMenu: React.FC<Props> = observer(({ views, onSelect }) => (
  <PowerKMenuBuilder
    items={views}
    getKey={(view) => view.id}
    getIcon={() => Layers}
    getValue={(view) => view.name}
    getLabel={(view) => view.name}
    onSelect={onSelect}
    emptyText="No views found"
  />
));
