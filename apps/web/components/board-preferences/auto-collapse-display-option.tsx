/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// the auto-collapse setting, mirrored in every board's display menu.

import { useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
// components
import { MenuCheckboxItem } from "@makeplane/propel/components/menu";
// hooks
import { useUser } from "@/hooks/store/user";
// local imports
import { getBoardPreferencesStore } from "@/lib/board-preferences/store";

export const AutoCollapseDisplayOption = observer(function AutoCollapseDisplayOption() {
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const userId = currentUser?.id;
  const store = getBoardPreferencesStore();

  useEffect(() => {
    void store.ensure(userId);
  }, [store, userId]);

  if (!store.isLoadedFor(userId)) return null;
  const enabled = store.settings.auto_collapse_empty_groups;

  return (
    <MenuCheckboxItem
      label={t("account_settings.preferences.auto_collapse_title")}
      checked={enabled}
      onCheckedChange={(checked) =>
        store
          .update({ auto_collapse_empty_groups: checked })
          .catch(() => setToast({ type: "error", title: t("error"), message: t("something_went_wrong") }))
      }
    />
  );
});
