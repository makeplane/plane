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
import { MembersPropertyIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";

type Props = {
  value: string[];
  onChange: (assigneeIds: string[]) => void;
  buttonClassName?: string;
  className?: string;
  disabled?: boolean;
  button?: React.ReactNode;
};

export function MembersDropdown(props: Props) {
  const { value, onChange, disabled = false, buttonClassName = "", className = "", button } = props;

  function DropdownLabel() {
    return (
      <div
        className={cn(
          "px-2 text-11 h-full flex cursor-pointer items-center gap-2 text-secondary border-[0.5px] border-subtle-1 hover:bg-layer-1 rounded",
          buttonClassName
        )}
      >
        <MembersPropertyIcon className="h-3 w-3 flex-shrink-0" />
        <span>{value ? value.length : "Members"}</span>
      </div>
    );
  }

  return (
    <MemberDropdown
      value={value}
      onChange={(assigneeIds) => {
        onChange(assigneeIds);
      }}
      buttonClassName={cn({ "hover:bg-transparent": value?.length > 0 }, buttonClassName)}
      placeholder="Members"
      button={button || <DropdownLabel />}
      className={className}
      disabled={disabled}
      buttonVariant="border-with-text"
      multiple
    />
  );
}
