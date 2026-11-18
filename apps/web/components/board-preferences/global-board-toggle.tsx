/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Profile settings > Preferences toggle for the global board template.

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import { EIssuesStoreType } from "@plane/types";
import { Switch } from "@makeplane/propel/components/switch";
// components
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useUser } from "@/hooks/store/user";
// local imports
import { getBoardPreferencesStore } from "@/lib/board-preferences/store";

export const GlobalBoardPreferenceToggle = observer(function GlobalBoardPreferenceToggle() {
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  const store = getBoardPreferencesStore();
  const [saving, setSaving] = useState(false);
  const userId = currentUser?.id;

  useEffect(() => {
    void store.ensure(userId);
  }, [store, userId]);

  const loaded = store.isLoadedFor(userId);
  const enabled = loaded && store.settings.global_board.enabled;

  const handleChange = async (value: boolean) => {
    if (!loaded || saving) return;
    setSaving(true);
    try {
      await issuesFilter.globalBoard.setEnabled(value);
    } catch (_error) {
      setToast({ type: "error", title: t("error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsControlItem
      title={t("account_settings.preferences.global_board_title")}
      description={t("account_settings.preferences.global_board_description")}
      control={
        <Switch
          size="sm"
          checked={enabled}
          onCheckedChange={(value) => void handleChange(value)}
          disabled={!loaded || saving}
          aria-label={t("account_settings.preferences.global_board_title")}
        />
      }
    />
  );
});
