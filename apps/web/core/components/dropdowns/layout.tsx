/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { ISSUE_LAYOUT_MAP } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/elements/button";
import { CheckIcon } from "@plane/propel/icons";
import { EIssueLayoutTypes } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// components
import { IssueLayoutIcon } from "@/components/issues/issue-layouts/layout-icon";

type TLayoutDropDown = {
  onChange: (value: EIssueLayoutTypes) => void;
  value: EIssueLayoutTypes;
  disabledLayouts?: EIssueLayoutTypes[];
};

export const LayoutDropDown = observer(function LayoutDropDown(props: TLayoutDropDown) {
  const { onChange, value = EIssueLayoutTypes.LIST, disabledLayouts = [] } = props;
  const { t } = useTranslation();
  const availableLayouts = useMemo(
    () => Object.values(ISSUE_LAYOUT_MAP).filter((layout) => !disabledLayouts.includes(layout.key)),
    [disabledLayouts]
  );
  const selectedLayout = ISSUE_LAYOUT_MAP[value];

  return (
    <CustomMenu
      customButton={
        <Button variant="secondary" size="md" stretch="auto" render={<div />}>
          <IssueLayoutIcon layout={selectedLayout.key} strokeWidth={2} className="size-3.5 text-secondary" />
          <span className="text-11 font-medium">{t(selectedLayout.i18n_label)}</span>
        </Button>
      }
      placement="bottom-end"
      closeOnSelect
    >
      {availableLayouts.map((issueLayout) => (
        <CustomMenu.MenuItem
          key={issueLayout.key}
          className="flex items-center justify-between gap-2"
          onClick={() => onChange(issueLayout.key)}
        >
          <div className="flex items-center gap-2">
            <IssueLayoutIcon layout={issueLayout.key} strokeWidth={2} className="size-3 text-secondary" />
            <span className="text-11 font-medium">{t(issueLayout.i18n_label)}</span>
          </div>
          {value === issueLayout.key && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
        </CustomMenu.MenuItem>
      ))}
    </CustomMenu>
  );
});
