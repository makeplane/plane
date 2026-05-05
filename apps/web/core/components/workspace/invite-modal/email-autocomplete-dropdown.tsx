/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { useTranslation } from "@plane/i18n";
import type { IUserLite } from "@plane/types";
import { Avatar } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";

type TEmailAutocompleteDropdownProps = {
  suggestions: IUserLite[];
  activeIndex: number;
  onSelect: (user: IUserLite) => void;
  onHover: (index: number) => void;
};

export const EmailAutocompleteDropdown = ({
  suggestions,
  activeIndex,
  onSelect,
  onHover,
}: TEmailAutocompleteDropdownProps) => {
  const { t } = useTranslation();

  return (
    <div className="absolute top-full left-0 z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-sm border border-strong bg-surface-1 shadow-raised-200">
      {suggestions.length === 0 ? (
        <div className="px-3 py-2 text-caption-sm-regular text-custom-text-300">
          {t("workspace_settings.settings.members.modal.no_suggestions")}
        </div>
      ) : (
        suggestions.map((user, i) => {
          const fullName = (
            [user.last_name, user.first_name].filter(Boolean).join(" ").trim() ||
            user.display_name ||
            ""
          ).toUpperCase();
          // Line 2: "Position - Department" with email fallback
          const subtitle = [user.position, user.department_name].filter(Boolean).join(" - ") || user.email || "";

          return (
            <button
              key={user.id}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-body-xs-regular hover:bg-layer-transparent-hover",
                { "bg-layer-transparent-hover": i === activeIndex }
              )}
              onMouseEnter={() => onHover(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(user);
              }}
            >
              <Avatar name={fullName} src={getFileURL(user.avatar_url ?? "")} size="sm" />
              <div className="flex flex-col min-w-0">
                <span className="truncate font-medium">
                  {fullName}
                  {user.staff_id && <span className="ml-1 font-normal text-custom-primary-100">({user.staff_id})</span>}
                </span>
                <span className="truncate text-custom-text-300 text-caption-sm-regular">{subtitle}</span>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
};
