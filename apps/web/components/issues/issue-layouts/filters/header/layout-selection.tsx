/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { Tab, Tabs, TabsList } from "@makeplane/propel/components/tabs";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { ISSUE_LAYOUTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { EIssueLayoutTypes } from "@plane/types";
// components
import { IssueLayoutIcon } from "@/components/issues/issue-layouts/layout-icon";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  layouts: EIssueLayoutTypes[];
  onChange: (layout: EIssueLayoutTypes) => void;
  selectedLayout: EIssueLayoutTypes | undefined;
};

export function LayoutSelection(props: Props) {
  const { layouts, onChange, selectedLayout } = props;
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  const handleOnChange = (layoutKey: EIssueLayoutTypes | null) => {
    if (layoutKey !== null && layouts.includes(layoutKey) && selectedLayout !== layoutKey) {
      onChange(layoutKey);
    }
  };

  return (
    <Tabs variant="contained" value={selectedLayout ?? null} onValueChange={handleOnChange}>
      <TabsList aria-label={t("common.layout")}>
        {ISSUE_LAYOUTS.map((layout) => {
          if (!layouts.includes(layout.key)) return null;
          const label = t(layout.i18n_title);
          return (
            <Tooltip key={layout.key} label={label} disabled={isMobile}>
              <Tab
                value={layout.key}
                icon={<IssueLayoutIcon layout={layout.key} size={16} />}
                label=""
                aria-label={label}
              />
            </Tooltip>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
