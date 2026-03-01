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

import type React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Switch } from "@plane/propel/switch";

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
    <div className="w-full flex items-center justify-between px-4 py-2 border-t border-subtle bg-surface-2/80 rounded-b-lg">
      <div />
      <div className="flex items-center gap-2">
        <span className="text-11 text-tertiary">{t("power_k.footer.workspace_level")}</span>
        <Switch
          value={isWorkspaceLevel}
          onChange={() => onWorkspaceLevelChange(!isWorkspaceLevel)}
          disabled={!projectId}
        />
      </div>
    </div>
  );
});
