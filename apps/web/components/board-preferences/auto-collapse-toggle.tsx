/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Profile settings > Preferences toggle for auto-collapsing empty groups.

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import { Switch } from "@makeplane/propel/components/switch";
// components
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useUser } from "@/hooks/store/user";
// local imports
import { getBoardPreferencesStore } from "@/lib/board-preferences/store";

export const AutoCollapsePreferenceToggle = observer(function AutoCollapsePreferenceToggle() {
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const store = getBoardPreferencesStore();
  const [saving, setSaving] = useState(false);
  const userId = currentUser?.id;

  useEffect(() => {
    void store.ensure(userId);
  }, [store, userId]);

  const loaded = store.isLoadedFor(userId);
  const enabled = loaded && store.settings.auto_collapse_empty_groups;

  const handleChange = async (value: boolean) => {
    if (!loaded || saving) return;
    setSaving(true);
    try {
      await store.update({ auto_collapse_empty_groups: value });
    } catch (_error) {
      setToast({ type: "error", title: t("error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsControlItem
      title={t("account_settings.preferences.auto_collapse_title")}
      description={t("account_settings.preferences.auto_collapse_description")}
      control={
        <Switch
          size="sm"
          checked={enabled}
          onCheckedChange={(value) => void handleChange(value)}
          disabled={!loaded || saving}
          aria-label={t("account_settings.preferences.auto_collapse_title")}
        />
      }
    />
  );
});
