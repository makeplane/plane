"use client";

import React from "react";
import { CommandIcon } from "lucide-react";
import { ToggleSwitch } from "@plane/ui";

interface ICommandModalFooterProps {
  platform: string;
  isWorkspaceLevel: boolean;
  projectId: string | undefined;
  onWorkspaceLevelChange: (value: boolean) => void;
}

export const CommandModalFooter: React.FC<ICommandModalFooterProps> = (props) => {
  const { platform, isWorkspaceLevel, projectId, onWorkspaceLevelChange } = props;

  return (
    <div className="w-full flex items-center justify-between px-4 py-2 border-t border-custom-border-200 bg-custom-background-90/80 rounded-b-lg">
      <div className="flex items-center gap-2">
        <span className="text-xs text-custom-text-300">Actions</span>
        <div className="flex items-center gap-1">
          <div className="grid h-6 min-w-[1.5rem] place-items-center rounded bg-custom-background-80 border-[0.5px] border-custom-border-200 px-1.5 text-[10px] text-custom-text-200">
            {platform === "MacOS" ? <CommandIcon className="h-2.5 w-2.5 text-custom-text-200" /> : "Ctrl"}
          </div>
          <kbd className="grid h-6 min-w-[1.5rem] place-items-center rounded bg-custom-background-80 border-[0.5px] border-custom-border-200 px-1.5 text-[10px] text-custom-text-200">
            K
          </kbd>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-custom-text-300">Workspace Level</span>
        <ToggleSwitch
          value={isWorkspaceLevel}
          onChange={() => onWorkspaceLevelChange(!isWorkspaceLevel)}
          disabled={!projectId}
          size="sm"
        />
      </div>
    </div>
  );
};
