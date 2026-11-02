/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
// Element tier on purpose: the menu trigger is the native button, so only its styling is borrowed.
import { Button as ButtonElement, ButtonLabel } from "@makeplane/propel/elements/button";
import { ChevronDownOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// local imports
import { ElementTransition } from "./transition-components";

type TViewControlAction = {
  enabled: boolean;
  label?: string;
  onClick: () => void | Promise<void>;
};

type Props = {
  save: TViewControlAction;
  update: TViewControlAction & { isUpdating: boolean };
};

/**
 * Save / update actions for the filters row. With only one of them available it renders as a single
 * button; with both, they collapse into one "Save" menu so the row keeps a single action.
 */
export const RichFiltersViewControls = observer(function RichFiltersViewControls(props: Props) {
  const { save, update } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const saveLabel = save.label ?? t("rich_filters.view_controls.save_as");
  const updateLabel = update.label ?? t("rich_filters.view_controls.update_view");
  const isVisible = save.enabled || update.enabled;
  const currentMode = save.enabled && update.enabled ? "menu" : save.enabled ? "save" : "update";
  // keep the last shown control while the transition fades it out, so it doesn't swap mid-exit
  const [mode, setMode] = useState(currentMode);
  if (isVisible && mode !== currentMode) setMode(currentMode);

  return (
    <ElementTransition show={isVisible}>
      {mode === "menu" ? (
        <Menu>
          <MenuTrigger
            aria-label={t("rich_filters.view_controls.save_options")}
            disabled={update.isUpdating}
            render={<ButtonElement variant="secondary" size="sm" stretch="auto" />}
          >
            <ButtonLabel>{update.isUpdating ? t("common.confirming") : t("save")}</ButtonLabel>
            <ChevronDownOutline className="size-3.5" />
          </MenuTrigger>
          <MenuContent side="bottom" align="end">
            <MenuItem label={updateLabel} onClick={() => void update.onClick()} />
            <MenuItem label={saveLabel} onClick={() => void save.onClick()} />
          </MenuContent>
        </Menu>
      ) : mode === "save" ? (
        <Button variant="secondary" size="sm" stretch="auto" label={saveLabel} onClick={() => void save.onClick()} />
      ) : (
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          label={update.isUpdating ? t("common.confirming") : updateLabel}
          onClick={() => void update.onClick()}
          loading={update.isUpdating}
          disabled={update.isUpdating}
        />
      )}
    </ElementTransition>
  );
});
