/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { DeleteOutline, EditOutline, ToggleOffOutline, ToggleOnOutline } from "@makeplane/propel/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { useTranslation } from "@plane/i18n";
import type { TIssueType } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { getIssueTypeLogoIcon, IssueTypeLogo } from "./common/issue-type-logo";

type Props = {
  issueType: TIssueType;
  onEdit: (issueType: TIssueType) => void;
  onDelete: (issueType: TIssueType) => void;
  onEnableDisable: (issueType: TIssueType) => Promise<void>;
};

export const IssueTypeListItem = observer(function IssueTypeListItem(props: Props) {
  const { issueType, onEdit, onDelete, onEnableDisable } = props;
  // translation
  const { t } = useTranslation();
  // states
  const [isToggling, setIsToggling] = useState(false);
  // derived values
  const isDefault = issueType.is_default;
  const isActive = issueType.is_active;

  const handleToggleActive = async () => {
    setIsToggling(true);
    try {
      await onEnableDisable(issueType);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-3 overflow-hidden">
        <IssueTypeLogo
          icon_props={getIssueTypeLogoIcon(issueType.logo_props)}
          size="lg"
          containerClassName={cn(!isActive && "opacity-60")}
        />
        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="truncate text-13 font-medium text-primary">{issueType.name}</span>
            {isDefault && (
              <span className="shrink-0 rounded border border-accent-strong px-2 py-0.5 text-11 font-medium text-accent-primary">
                {t("common.default")}
              </span>
            )}
            {!isActive && (
              <span className="shrink-0 rounded bg-layer-2 px-2 py-0.5 text-11 font-medium text-tertiary">
                {t("common.disabled")}
              </span>
            )}
          </div>
          {issueType.description && <span className="truncate text-11 text-tertiary">{issueType.description}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <IconButton
          variant="ghost"
          size="md"
          icon={<Icon icon={EditOutline} />}
          aria-label={t("common.edit")}
          onClick={() => onEdit(issueType)}
        />
        <IconButton
          variant="ghost"
          size="md"
          icon={<Icon icon={isActive ? ToggleOffOutline : ToggleOnOutline} />}
          aria-label={t("work_item_types.enable_disable.tooltip", {
            action: isActive ? "disable" : "enable",
          })}
          loading={isToggling}
          disabled={isDefault}
          onClick={() => void handleToggleActive()}
        />
        <IconButton
          variant="ghost"
          size="md"
          icon={<Icon icon={DeleteOutline} />}
          aria-label={t("common.delete")}
          disabled={isDefault}
          onClick={() => onDelete(issueType)}
        />
      </div>
    </div>
  );
});
