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

import { useTheme } from "next-themes";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// assets
import { GANTT_TIMELINE_TYPE, INITIATIVE_SCOPE_TABS } from "@plane/types";
import initiativesGanttDark from "@/app/assets/empty-state/initiatives/scope/initiatives-gantt-dark.webp?url";
import initiativesGanttLight from "@/app/assets/empty-state/initiatives/scope/initiatives-gantt-light.webp?url";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";
import { TimeLineTypeContext } from "@/components/timeline/contexts";
import { AddScopeButton } from "../../common/add-scope-button";
import { useInitiativeScopeShared } from "../filters/context-shared";
import { ScopeTimelineChartRoot } from "./chart/chart-root";

type Props = {
  epicIds: string[];
  projectIds: string[];
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  isDataLoading?: boolean;
  handleAddEpic: () => void;
  handleAddProject: () => void;
};
export function InitiativeScopeTimelineView(props: Props) {
  const { epicIds, projectIds, workspaceSlug, handleAddEpic, handleAddProject, initiativeId, disabled, isDataLoading } =
    props;
  const { activeTab } = useInitiativeScopeShared();

  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  const isEmpty = epicIds.length === 0 && projectIds.length === 0;

  const resolvedAssetPath = resolvedTheme === "light" ? initiativesGanttLight : initiativesGanttDark;

  if (isDataLoading) return <ListLayoutLoader />;

  if (isEmpty)
    return (
      <DetailedEmptyState
        assetPath={resolvedAssetPath}
        title={t("initiatives.scope.empty_state.title")}
        description={t("initiatives.scope.empty_state.description")}
        customPrimaryButton={
          <AddScopeButton
            disabled={disabled}
            customButton={<Button>{t("initiatives.scope.empty_state.primary_button.text")}</Button>}
          />
        }
      />
    );

  if (activeTab === INITIATIVE_SCOPE_TABS.EPICS) {
    return (
      <TimeLineTypeContext.Provider value={GANTT_TIMELINE_TYPE.ISSUE}>
        <ScopeTimelineChartRoot
          activeTab={activeTab}
          epicIds={epicIds}
          projectIds={projectIds}
          workspaceSlug={workspaceSlug}
          handleAddEpic={handleAddEpic}
          handleAddProject={handleAddProject}
          initiativeId={initiativeId}
          disabled={disabled}
        />
      </TimeLineTypeContext.Provider>
    );
  }
  if (activeTab === INITIATIVE_SCOPE_TABS.PROJECTS) {
    return (
      <TimeLineTypeContext.Provider value={GANTT_TIMELINE_TYPE.PROJECT}>
        <ScopeTimelineChartRoot
          activeTab={activeTab}
          epicIds={epicIds}
          projectIds={projectIds}
          workspaceSlug={workspaceSlug}
          handleAddEpic={handleAddEpic}
          handleAddProject={handleAddProject}
          initiativeId={initiativeId}
          disabled={disabled}
        />
      </TimeLineTypeContext.Provider>
    );
  }

  return null;
}
