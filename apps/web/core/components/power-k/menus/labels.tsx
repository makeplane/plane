import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { IIssueLabel } from "@plane/types";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  labels: IIssueLabel[];
  onSelect: (label: IIssueLabel) => void;
  value?: string[];
};

export const PowerKLabelsMenu = observer(function PowerKLabelsMenu({ labels, onSelect, value }: Props) {
  return (
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
      isSelected={(label) => !!value?.includes(label.id)}
      onSelect={onSelect}
      emptyText="No labels found"
    />
  );
});
