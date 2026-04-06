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
// plane imports
import { EntityDetailWidgetSection } from "@plane/blocks/entity-detail";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// Plane-web
import { useCustomRelationOptions } from "@/components/relations";
// local imports
import { RelationsCollapsibleContent } from "./content";
import { RelationActionButton } from "./quick-action-button";

type Props = {
  workspaceSlug: string;
  issueId: string;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const RelationsCollapsible = observer(function RelationsCollapsible(props: Props) {
  const { workspaceSlug, issueId, disabled = false, issueServiceType } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    openWidgets,
    toggleOpenWidget,
    relation: { getRelationCountByIssueId },
  } = useIssueDetail(issueServiceType);

  const RELATION_OPTIONS = useCustomRelationOptions();
  // derived values
  const isCollapsibleOpen = openWidgets.includes("relations");
  const relationsCount = getRelationCountByIssueId(issueId, RELATION_OPTIONS);

  return (
    <EntityDetailWidgetSection
      title={t("common.relations")}
      count={relationsCount}
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("relations")}
      actionElement={
        !disabled ? (
          <RelationActionButton issueId={issueId} disabled={disabled} issueServiceType={issueServiceType} />
        ) : undefined
      }
    >
      <RelationsCollapsibleContent
        workspaceSlug={workspaceSlug}
        issueId={issueId}
        disabled={disabled}
        issueServiceType={issueServiceType}
      />
    </EntityDetailWidgetSection>
  );
});
