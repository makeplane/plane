/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ListTree } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IProject } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
// component
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

export const CascadeStateAutomation = observer(function CascadeStateAutomation(props: Props) {
  const { handleChange } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();
  const { t } = useTranslation();

  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug?.toString(),
    currentProjectDetails?.id
  );

  const cascadeStatus = useMemo(() => currentProjectDetails?.cascade_state_on_close ?? false, [currentProjectDetails]);

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-sm bg-layer-2">
          <ListTree className="size-4 shrink-0 text-primary" />
        </div>
        <SettingsControlItem
          title={t("project_settings.automations.cascade-state.title")}
          description={t("project_settings.automations.cascade-state.description")}
          control={
            <ToggleSwitch
              value={cascadeStatus}
              onChange={(val: boolean) => void handleChange({ cascade_state_on_close: val })}
              size="sm"
              disabled={!isAdmin}
            />
          }
        />
      </div>
    </div>
  );
});
