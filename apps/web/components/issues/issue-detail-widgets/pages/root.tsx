/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { AddOutline } from "@makeplane/propel/icons";
import { Collapsible } from "@makeplane/propel/components/collapsible";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { IssueDetailWidgetButton } from "../widget-button";
import { IssuePagesCollapsibleContent } from "./content";
import { IssuePagesCollapsibleTitle } from "./title";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssuePagesCollapsible = observer(function IssuePagesCollapsible(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType } = props;
  const { t } = useTranslation();
  const { openWidgets, toggleOpenWidget } = useIssueDetail(issueServiceType);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [count, setCount] = useState(0);
  const isOpen = openWidgets.includes("pages");
  const onCountChange = useCallback((nextCount: number) => setCount(nextCount), []);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={() => toggleOpenWidget("pages")}
      trigger={<IssuePagesCollapsibleTitle count={count} />}
      trailing={
        !disabled ? (
          <IssueDetailWidgetButton
            title={t("issue.pages.link_pages")}
            icon={<AddOutline className="h-3.5 w-3.5 flex-shrink-0" />}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              setPickerOpen(true);
            }}
          />
        ) : undefined
      }
    >
      <IssuePagesCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        disabled={disabled}
        issueServiceType={issueServiceType}
        pickerOpen={pickerOpen}
        onPickerClose={() => setPickerOpen(false)}
        onCountChange={onCountChange}
      />
    </Collapsible>
  );
});
