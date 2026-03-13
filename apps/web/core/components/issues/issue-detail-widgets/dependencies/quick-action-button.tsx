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

import React from "react";
import { observer } from "mobx-react";

import { useTranslation } from "@plane/i18n";
import { PlusIcon } from "@plane/propel/icons";
// plane imports
import type { TIssueServiceType } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// Plane-web
import { useDependencyOptions } from "@/components/relations";

type Props = {
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const DependencyActionButton = observer(function DependencyActionButton(props: Props) {
  const { customButton, issueId, disabled = false, issueServiceType } = props;
  const { t } = useTranslation();
  // store hooks
  const { toggleRelationModal, setRelationKey } = useIssueDetail(issueServiceType);

  const DEPENDENCY_OPTIONS = useDependencyOptions();

  // handlers
  const handleOnClick = (relationKey: string) => {
    setRelationKey(relationKey);
    toggleRelationModal(issueId, relationKey);
  };

  // button element
  const customButtonElement = customButton ? <>{customButton}</> : <PlusIcon className="h-4 w-4" />;

  return (
    <CustomMenu
      customButton={customButtonElement}
      placement="bottom-start"
      disabled={disabled}
      maxHeight="lg"
      closeOnSelect
    >
      {Object.values(DEPENDENCY_OPTIONS).map((item, index) => {
        if (!item) return <></>;

        return (
          <CustomMenu.MenuItem
            key={index}
            onClick={() => {
              handleOnClick(item.key);
            }}
          >
            <div className="flex items-center gap-2">
              {item.icon(12)}
              <span>{t(item.i18n_label)}</span>
            </div>
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
});
