/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { EntityDetailWidgetSection } from "@plane/blocks/entity-detail";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { useTimeLineRelationOptions } from "@/components/relations";
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
  const ISSUE_RELATION_OPTIONS = useTimeLineRelationOptions();
  // derived values
  const isCollapsibleOpen = openWidgets.includes("relations");
  const relationsCount = getRelationCountByIssueId(issueId, ISSUE_RELATION_OPTIONS);

  return (
    <EntityDetailWidgetSection
      title={t("common.relations")}
      count={relationsCount}
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("relations")}
      actions={
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
