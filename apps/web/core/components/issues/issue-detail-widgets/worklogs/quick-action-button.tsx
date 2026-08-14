/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "@plane/propel/icons";

type Props = {
  customButton?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
};

export const IssueWorklogActionButton = observer(function IssueWorklogActionButton(props: Props) {
  const { customButton, disabled = false, onClick } = props;

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <button type="button" onClick={handleOnClick} disabled={disabled}>
      {customButton ? customButton : <PlusIcon className="h-4 w-4" />}
    </button>
  );
});
