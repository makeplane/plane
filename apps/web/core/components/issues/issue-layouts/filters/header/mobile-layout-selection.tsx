/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Icon as PropelIcon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { Button as ButtonChrome } from "@makeplane/propel/elements/button";
import { ChevronDownOutline } from "@makeplane/propel/icons";
import { ISSUE_LAYOUTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { EIssueLayoutTypes } from "@plane/types";
import { IssueLayoutIcon } from "../../layout-icon";

export function MobileLayoutSelection({
  layouts,
  onChange,
  activeLayout,
}: {
  layouts: EIssueLayoutTypes[];
  onChange: (layout: EIssueLayoutTypes) => void;
  activeLayout?: EIssueLayoutTypes;
  isMobile?: boolean;
}) {
  const { t } = useTranslation();
  return (
    // Propel's `Menu` renders no element of its own; this host keeps the legacy menu root's grow-and-center slot.
    <div className="flex flex-grow justify-center text-13 text-secondary">
      <Menu>
        <MenuTrigger
          aria-label={t("common.layout")}
          render={
            // `MenuTrigger` supplies the button behaviour; the Propel element is the chrome.
            <ButtonChrome variant="secondary" size="sm" stretch="auto">
              {activeLayout && (
                <IssueLayoutIcon layout={activeLayout} size={14} strokeWidth={2} className="h-3.5 w-3.5" />
              )}
              <ChevronDownOutline className="my-auto size-3 text-secondary" />
            </ButtonChrome>
          }
        />
        <MenuContent side="bottom" align="start">
          {ISSUE_LAYOUTS.filter((l) => layouts.includes(l.key)).map((layout) => (
            <MenuItem
              key={layout.key}
              icon={<PropelIcon icon={<IssueLayoutIcon layout={layout.key} className="h-3 w-3" />} />}
              label={t(layout.i18n_label)}
              onClick={() => {
                onChange(layout.key);
              }}
            />
          ))}
        </MenuContent>
      </Menu>
    </div>
  );
}
