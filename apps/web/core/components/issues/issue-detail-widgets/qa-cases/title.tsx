"use client";

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
import { CollapsibleButton, Button } from "@plane/ui";

type Props = {
  isOpen: boolean;
  disabled: boolean;
  onRefresh: () => void;
};

export const QaCasesCollapsibleTitle: FC<Props> = observer((props) => {
  const { isOpen, disabled, onRefresh } = props;

  return <CollapsibleButton isOpen={isOpen} title={"用例"} />;
});
