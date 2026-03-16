/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { IUserLite } from "@plane/types";
import { Avatar, Tooltip } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { CloseIcon } from "@plane/propel/icons";

type TSelectedUserDisplayProps = {
  user: IUserLite;
  onClear: () => void;
};

/**
 * Chip displayed after selecting a user from the autocomplete dropdown.
 * Shows: FULL NAME (StaffID) + Position - Department instead of raw email.
 */
export const SelectedUserDisplay = ({ user, onClear }: TSelectedUserDisplayProps) => {
  const fullName = (
    [user.last_name, user.first_name].filter(Boolean).join(" ").trim() ||
    user.display_name ||
    ""
  ).toUpperCase();
  const subtitle = [user.position, user.department_name].filter(Boolean).join(" - ");

  // Tooltip: 2-line full info on hover
  const tooltipContent = (
    <div className="flex flex-col">
      <span className="font-medium">
        {fullName}
        {user.staff_id && <span className="ml-1 font-normal">({user.staff_id})</span>}
      </span>
      {subtitle && <span className="text-custom-text-300">{subtitle}</span>}
    </div>
  );

  return (
    <Tooltip tooltipContent={tooltipContent} position="bottom" className="border border-strong">
      <div className="flex h-[36px] w-full items-center gap-2 overflow-hidden rounded-md border border-strong bg-surface-1 px-2.5 transition-colors hover:border-custom-primary-100 hover:bg-layer-transparent-hover">
        <Avatar name={fullName} src={getFileURL(user.avatar_url ?? "")} size="sm" className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-body-xs-medium">
          {fullName}
          {user.staff_id && <span className="ml-1 font-normal text-custom-primary-100">({user.staff_id})</span>}
          {subtitle && <span className="ml-1 font-normal text-custom-text-300">· {subtitle}</span>}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="flex shrink-0 items-center justify-center rounded-sm p-0.5 hover:bg-layer-transparent-hover"
        >
          <CloseIcon className="h-3.5 w-3.5 text-secondary" />
        </button>
      </div>
    </Tooltip>
  );
};
