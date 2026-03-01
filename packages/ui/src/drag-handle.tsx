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

import { MoreVertical } from "lucide-react";
import React, { forwardRef } from "react";
// helpers
import { cn } from "./utils";

interface IDragHandle {
  className?: string;
  disabled?: boolean;
}

export const DragHandle = forwardRef(function DragHandle(
  props: IDragHandle,
  ref: React.ForwardedRef<HTMLButtonElement | null>
) {
  const { className, disabled = false } = props;

  if (disabled) {
    return <div className="w-[14px] h-[18px]" />;
  }

  return (
    <button
      type="button"
      className={cn("p-0.5 flex flex-shrink-0 rounded-sm bg-surface-2 text-secondary cursor-grab", className)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      ref={ref}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-placeholder size-3.5"
      >
        <path
          d="M6.0415 12.667C6.0415 12.6441 6.02335 12.6252 6.00049 12.625C5.97748 12.625 5.9585 12.644 5.9585 12.667C5.9585 12.69 5.97748 12.709 6.00049 12.709C6.02335 12.7088 6.0415 12.6899 6.0415 12.667ZM10.0415 12.667C10.0415 12.6441 10.0234 12.6252 10.0005 12.625C9.97748 12.625 9.9585 12.644 9.9585 12.667C9.9585 12.69 9.97748 12.709 10.0005 12.709C10.0234 12.7088 10.0415 12.6899 10.0415 12.667ZM6.0415 8C6.04133 7.97725 6.02324 7.95916 6.00049 7.95898C5.97758 7.95898 5.95867 7.97714 5.9585 8C5.9585 8.02301 5.97748 8.04199 6.00049 8.04199C6.02335 8.04182 6.0415 8.0229 6.0415 8ZM10.0415 8C10.0413 7.97725 10.0232 7.95916 10.0005 7.95898C9.97758 7.95898 9.95867 7.97714 9.9585 8C9.9585 8.02301 9.97748 8.04199 10.0005 8.04199C10.0234 8.04182 10.0415 8.0229 10.0415 8ZM6.0415 3.33398C6.0415 3.31108 6.02335 3.29217 6.00049 3.29199C5.97748 3.29199 5.9585 3.31097 5.9585 3.33398C5.95867 3.35685 5.97758 3.375 6.00049 3.375C6.02324 3.37482 6.04133 3.35674 6.0415 3.33398ZM10.0415 3.33398C10.0415 3.31108 10.0234 3.29217 10.0005 3.29199C9.97748 3.29199 9.9585 3.31097 9.9585 3.33398C9.95867 3.35685 9.97759 3.375 10.0005 3.375C10.0232 3.37482 10.0413 3.35674 10.0415 3.33398ZM7.2915 12.667C7.2915 13.3803 6.71371 13.9588 6.00049 13.959C5.28712 13.959 4.7085 13.3804 4.7085 12.667C4.7085 11.9536 5.28712 11.375 6.00049 11.375C6.71371 11.3752 7.2915 11.9537 7.2915 12.667ZM11.2915 12.667C11.2915 13.3803 10.7137 13.9588 10.0005 13.959C9.28712 13.959 8.7085 13.3804 8.7085 12.667C8.7085 11.9536 9.28712 11.375 10.0005 11.375C10.7137 11.3752 11.2915 11.9537 11.2915 12.667ZM7.2915 8C7.2915 8.71326 6.71371 9.29182 6.00049 9.29199C5.28712 9.29199 4.7085 8.71337 4.7085 8C4.70867 7.28678 5.28723 6.70898 6.00049 6.70898C6.7136 6.70916 7.29133 7.28689 7.2915 8ZM11.2915 8C11.2915 8.71326 10.7137 9.29182 10.0005 9.29199C9.28712 9.29199 8.7085 8.71337 8.7085 8C8.70867 7.28678 9.28723 6.70898 10.0005 6.70898C10.7136 6.70916 11.2913 7.28689 11.2915 8ZM7.2915 3.33398C7.29133 4.04709 6.7136 4.62482 6.00049 4.625C5.28723 4.625 4.70867 4.0472 4.7085 3.33398C4.7085 2.62062 5.28712 2.04199 6.00049 2.04199C6.71371 2.04217 7.2915 2.62073 7.2915 3.33398ZM11.2915 3.33398C11.2913 4.04709 10.7136 4.62482 10.0005 4.625C9.28723 4.625 8.70867 4.0472 8.7085 3.33398C8.7085 2.62062 9.28712 2.04199 10.0005 2.04199C10.7137 2.04217 11.2915 2.62072 11.2915 3.33398Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
});

DragHandle.displayName = "DragHandle";
