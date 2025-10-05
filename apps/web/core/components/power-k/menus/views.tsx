"use client";

import React from "react";
import { observer } from "mobx-react";
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
    heading="Views"
    items={views}
    getKey={(view) => view.id}
    getLabel={(view) => view.name}
    onSelect={onSelect}
    emptyText="No views found"
  />
));
