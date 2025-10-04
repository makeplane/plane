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
    heading="Labels"
    items={labels}
    getKey={(label) => label.id}
    getLabel={(label) => label.name}
    onSelect={onSelect}
    emptyText="No labels found"
  />
));
