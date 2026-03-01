/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane imports
import { PlusIcon } from "@plane/propel/icons";
import { getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";

type Props = {
  toggleModal: () => void;
  variant?: "default" | "compact";
};
export function AddMilestoneButton(props: Props) {
  const { toggleModal, variant = "default" } = props;

  const handleClick = (e: React.MouseEvent<HTMLDivElement | SVGElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleModal();
  };

  return (
    <>
      {variant === "default" ? (
        <div
          onClick={handleClick}
          className={cn(getButtonStyling("secondary", "base"), "font-medium px-2 py-1 cursor-pointer")}
        >
          Create
        </div>
      ) : (
        <PlusIcon className="h-4 w-4" onClick={handleClick} />
      )}
    </>
  );
}
