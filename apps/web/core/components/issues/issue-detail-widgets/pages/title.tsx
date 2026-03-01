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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { CollapsibleButton } from "@plane/propel/collapsible";
// components
import { PagesActionButton } from "./quick-action-button";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
  count: number;
  issueServiceType: TIssueServiceType;
};

export const PagesCollapsibleTitle = observer(function PagesCollapsibleTitle(props: Props) {
  const { isOpen, workItemId, disabled, count, issueServiceType } = props;
  const { t } = useTranslation();

  // indicator element
  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center ">
        <p className="text-14 text-tertiary !leading-3">{count}</p>
      </span>
    ),
    [count]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title={t("issue.pages.linked_pages")}
      indicatorElement={indicatorElement}
      actionItemElement={
        !disabled && (
          <PagesActionButton issueServiceType={issueServiceType} disabled={disabled} workItemId={workItemId} />
        )
      }
    />
  );
});
