/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Switch } from "@makeplane/propel/components/switch";

type Props = {
  isWorkspaceLevel: boolean;
  projectId: string | undefined;
  onWorkspaceLevelChange: (value: boolean) => void;
};

export const PowerKModalFooter = observer(function PowerKModalFooter(props: Props) {
  const { isWorkspaceLevel, projectId, onWorkspaceLevelChange } = props;
  // translation
  const { t } = useTranslation();

  return (
    <div className="flex w-full items-center justify-between rounded-b-lg border-t border-subtle bg-surface-2/80 px-4 py-2">
      <div />
      <div className="flex items-center gap-2">
        <span className="text-11 text-tertiary">{t("power_k.footer.workspace_level")}</span>
        <Switch
          size="sm"
          checked={isWorkspaceLevel}
          onCheckedChange={onWorkspaceLevelChange}
          disabled={!projectId}
          aria-label={t("power_k.footer.workspace_level")}
        />
      </div>
    </div>
  );
});
