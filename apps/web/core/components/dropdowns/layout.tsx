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
import { EIssueLayoutTypes } from "@plane/types";
import { Select } from "@plane/blocks/select";
// components
import { IssueLayoutIcon } from "@/components/issues/issue-layouts/layout-icon";

type TLayoutOption = { key: EIssueLayoutTypes; i18n_label: string };

type TLayoutDropDown = {
  onChange: (value: EIssueLayoutTypes) => void;
  value: EIssueLayoutTypes;
  disabledLayouts?: EIssueLayoutTypes[];
};

export const LayoutDropDown = observer(function LayoutDropDown(props: TLayoutDropDown) {
  const { onChange, value = EIssueLayoutTypes.LIST, disabledLayouts = [] } = props;
  // plane i18n
  const { t } = useTranslation();
  // derived values
  const options = useMemo<TLayoutOption[]>(() => {
    const disabled = new Set(disabledLayouts);
    return Object.values(ISSUE_LAYOUT_MAP)
      .filter((layout) => !disabled.has(layout.key))
      .map((layout) => ({ key: layout.key, i18n_label: layout.i18n_label }));
  }, [disabledLayouts]);
  const selected = options.find((option) => option.key === value) ?? null;

  return (
    <Select<TLayoutOption>
      getValues={() => options}
      value={selected}
      onChange={(next) => onChange(next as EIssueLayoutTypes)}
      getOptionValue={(option) => option.key}
      getOptionLabel={(option) => t(option.i18n_label)}
      getOptionIcon={(option) => <IssueLayoutIcon layout={option.key} className="size-4 shrink-0 text-primary" />}
      showSearch={false}
      pinSelected={false}
    >
      <Select.Trigger variant="pill-lg" className="w-auto">
        {selected && (
          <>
            <IssueLayoutIcon layout={selected.key} className="size-3.5 text-secondary" />
            <span className="truncate">{t(selected.i18n_label)}</span>
          </>
        )}
      </Select.Trigger>
    </Select>
  );
});
