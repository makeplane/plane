/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { PageIcon, PlusIcon } from "@plane/propel/icons";
import { CollapsibleButton } from "@plane/ui";
import { IssueDetailWidgetButton } from "../widget-button";

type Props = {
  isOpen: boolean;
  count: number;
  disabled: boolean;
  onLink: () => void;
};

export const IssuePagesCollapsibleTitle = observer(function IssuePagesCollapsibleTitle(props: Props) {
  const { isOpen, count, disabled, onLink } = props;
  const { t } = useTranslation();

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title={
        <span className="flex items-center gap-2">
          <PageIcon className="h-3.5 w-3.5 text-tertiary" />
          {t("issue.pages.linked_pages")}
        </span>
      }
      indicatorElement={<span className="text-14 leading-3 text-tertiary">{count}</span>}
      actionItemElement={
        !disabled && (
          <IssueDetailWidgetButton
            title={t("issue.pages.link_pages")}
            icon={<PlusIcon className="h-3.5 w-3.5 flex-shrink-0" />}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onLink();
            }}
          />
        )
      }
    />
  );
});
