"use client";

import { memo } from "react";
import { ChevronDown, Trash2, Eye, Pencil, Check } from "lucide-react";
import { CustomMenu } from "@plane/ui";

const ACCESS_OPTIONS = [
  { value: "0", label: "View", icon: Eye },
  { value: "2", label: "Edit", icon: Pencil },
];

type TAccessMenuProps = {
  currentAccess: number;
  onUpdateAccess: (access: string) => void;
  onRemove: () => void;
  isOwner?: boolean;
};

export const AccessMenu = memo<TAccessMenuProps>(({ currentAccess, onUpdateAccess, onRemove, isOwner = false }) => {
  if (isOwner) {
    return <span className="text-xs text-custom-text-300 px-2 py-1">Owner</span>;
  }

  const currentOption = ACCESS_OPTIONS.find((opt) => opt.value === currentAccess.toString());
  const accessLabel = currentOption?.label || "View";

  return (
    <CustomMenu
      customButton={
        <div className="flex items-center gap-1 px-2 py-1 text-xs text-custom-text-300 hover:bg-custom-background-90 rounded transition-colors whitespace-nowrap">
          can {accessLabel.toLowerCase()}
          <ChevronDown className="h-3 w-3" />
        </div>
      }
      placement="bottom-end"
      closeOnSelect
    >
      {ACCESS_OPTIONS.map((option) => {
        const IconComponent = option.icon;
        const isSelected = option.value === currentAccess.toString();
        return (
          <CustomMenu.MenuItem key={option.value} onClick={() => onUpdateAccess(option.value)}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <IconComponent className="size-3" />
                can {option.label.toLowerCase()}
              </div>
              {isSelected && <Check className="size-3" />}
            </div>
          </CustomMenu.MenuItem>
        );
      })}
      <CustomMenu.MenuItem onClick={onRemove}>
        <div className="flex items-center gap-2 text-red-500">
          <Trash2 className="size-3" />
          Remove
        </div>
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
});

AccessMenu.displayName = "AccessMenu";
