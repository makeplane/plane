"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { IIssueLabel } from "@plane/types";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  labels: IIssueLabel[];
  onSelect: (label: IIssueLabel) => void;
};

export const PowerKLabelsMenu: React.FC<Props> = observer(({ labels, onSelect }) => (
  <PowerKMenuBuilder
    items={labels}
    getIconNode={(label) => (
      <span className="shrink-0 size-3.5 grid place-items-center">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: label.color }} />
      </span>
    )}
    getKey={(label) => label.id}
    getValue={(label) => label.name}
    getLabel={(label) => label.name}
    onSelect={onSelect}
    emptyText="No labels found"
  />
));
