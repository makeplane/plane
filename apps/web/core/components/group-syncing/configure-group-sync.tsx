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

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { debounce } from "lodash-es";
// plane imports
import type { GroupSyncConfig } from "@plane/types";
import { useTranslation } from "@plane/i18n";
import { Switch } from "@plane/propel/switch";
import { Input } from "@plane/ui";
// components
import { SettingsHeading } from "@/components/settings/heading";
// local imports
import { GROUP_SYNC_CONFIG } from "./helper";

type ConfigureGroupSyncProps = {
  syncConfig: GroupSyncConfig | undefined;
  handleChange: (payload: Partial<GroupSyncConfig>) => Promise<void>;
};

export const ConfigureGroupSync = observer(function ConfigureGroupSync(props: ConfigureGroupSyncProps) {
  // props
  const { syncConfig, handleChange } = props;
  // hooks
  const { t } = useTranslation();

  const [groupAttributeKeyInput, setGroupAttributeKeyInput] = useState(syncConfig?.group_attribute_key ?? "");

  const disabled = !syncConfig?.is_enabled;

  useEffect(() => {
    setGroupAttributeKeyInput(syncConfig?.group_attribute_key ?? "");
  }, [syncConfig?.group_attribute_key]);

  const debouncedUpdateGroupAttributeKey = useMemo(
    () =>
      debounce((value: string) => {
        void handleChange({ group_attribute_key: value });
      }, 500),
    [handleChange]
  );

  useEffect(() => () => debouncedUpdateGroupAttributeKey.cancel(), [debouncedUpdateGroupAttributeKey]);

  const handleGroupAttributeKeyChange = useCallback(
    (value: string) => {
      setGroupAttributeKeyInput(value);
      debouncedUpdateGroupAttributeKey(value);
    },
    [debouncedUpdateGroupAttributeKey]
  );

  return (
    <div className="mt-12">
      <SettingsHeading
        title={t("workspace_settings.settings.group_syncing.config.title")}
        variant="h6"
        description={t("workspace_settings.settings.group_syncing.config.description")}
      />

      <div className="mt-4 rounded-lg border transition-all border-subtle bg-layer-2">
        {Object.values(GROUP_SYNC_CONFIG).map((config) => {
          return (
            <div
              key={config.key}
              className="w-full border-b border-subtle px-4 py-3 flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4 md:gap-8"
            >
              <div className="flex flex-col gap-1.5">
                <h4 className="text-body-sm-medium text-primary">{t(config.i18n_title)}</h4>
                <p className="text-caption-md-regular text-tertiary">{t(config.i18n_description)}</p>
              </div>
              <div className="shrink-0">
                {!config.i18n_placeholder ? (
                  <Switch
                    value={Boolean(syncConfig?.[config.key])}
                    onChange={(value) => void handleChange({ [config.key]: value })}
                    disabled={disabled}
                  />
                ) : (
                  <Input
                    type="text"
                    placeholder={t(config.i18n_placeholder)}
                    value={groupAttributeKeyInput}
                    onChange={(e) => handleGroupAttributeKeyChange(e.target.value)}
                    disabled={disabled}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
