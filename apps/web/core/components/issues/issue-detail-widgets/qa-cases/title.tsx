"use client";

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
import { CollapsibleButton } from "@plane/ui";

type Props = {
  isOpen: boolean;
  disabled: boolean;
  onRefresh: () => void;
  count?: number;
};

export const QaCasesCollapsibleTitle: FC<Props> = observer((props) => {
  const { isOpen, count } = props;

  const indicatorElement =
    typeof count === "number" ? (
      <span className="flex items-center justify-center ">
        <p className="text-base text-custom-text-300 !leading-3">{count}</p>
      </span>
    ) : undefined;

  return <CollapsibleButton isOpen={isOpen} title={"用例"} indicatorElement={indicatorElement} />;
});
