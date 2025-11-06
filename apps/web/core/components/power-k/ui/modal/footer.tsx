"use client";

import type React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ToggleSwitch } from "@plane/ui";

type Props = {
  isWorkspaceLevel: boolean;
  projectId: string | undefined;
  onWorkspaceLevelChange: (value: boolean) => void;
};

export const PowerKModalFooter: React.FC<Props> = observer((props) => {
  const { isWorkspaceLevel, projectId, onWorkspaceLevelChange } = props;
  // translation
  const { t } = useTranslation();

  return (
    <div className="w-full flex items-center justify-between px-4 py-2 border-t border-custom-border-200 bg-custom-background-90/80 rounded-b-lg">
      <div />
      <div className="flex items-center gap-2">
        <span className="text-xs text-custom-text-300">{t("power_k.footer.workspace_level")}</span>
        <ToggleSwitch
          value={isWorkspaceLevel}
          onChange={() => onWorkspaceLevelChange(!isWorkspaceLevel)}
          disabled={!projectId}
          size="sm"
        />
      </div>
    </div>
  );
});
