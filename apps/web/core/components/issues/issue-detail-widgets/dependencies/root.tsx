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

import { observer } from "mobx-react";
// plane imports
import { EntityDetailWidgetSection } from "@plane/blocks/entity-detail";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// Plane-web
import { useDependencyOptions } from "@/components/relations";
// local imports
import { DependenciesCollapsibleContent } from "./content";
import { DependencyActionButton } from "./quick-action-button";

type Props = {
  workspaceSlug: string;
  issueId: string;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const DependenciesCollapsible = observer(function DependenciesCollapsible(props: Props) {
  const { workspaceSlug, issueId, disabled = false, issueServiceType } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    openWidgets,
    toggleOpenWidget,
    relation: { getRelationCountByIssueId },
  } = useIssueDetail(issueServiceType);

  const DEPENDENCY_OPTIONS = useDependencyOptions();
  // derived values
  const isCollapsibleOpen = openWidgets.includes("dependencies");
  const dependenciesCount = getRelationCountByIssueId(issueId, DEPENDENCY_OPTIONS);

  return (
    <EntityDetailWidgetSection
      title={t("common.dependencies")}
      count={dependenciesCount}
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("dependencies")}
      actionElement={
        !disabled ? (
          <DependencyActionButton issueId={issueId} disabled={disabled} issueServiceType={issueServiceType} />
        ) : undefined
      }
    >
      <DependenciesCollapsibleContent
        workspaceSlug={workspaceSlug}
        issueId={issueId}
        disabled={disabled}
        issueServiceType={issueServiceType}
      />
    </EntityDetailWidgetSection>
  );
});
