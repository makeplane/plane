"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { RelationsIcon } from "@plane/ui";
// components
import { CentralPaneHeaderActionButton } from "@/components/issues/issue-detail/central-pane";

type Props = {};

export const RelationsHeader: FC<Props> = observer((props) => {
  const {} = props;

  return (
    <CentralPaneHeaderActionButton
      title="Relations"
      icon={<RelationsIcon className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" />}
    />
  );
});
