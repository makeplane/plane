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

import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { INITIATIVE_SCOPE_TABS } from "@plane/types";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// assets
import initiativesListDark from "@/app/assets/empty-state/initiatives/scope/initiatives-list-dark.webp?url";
import initiativesListLight from "@/app/assets/empty-state/initiatives/scope/initiatives-list-light.webp?url";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { AddScopeButton } from "@/components/initiatives/common/add-scope-button";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";
import { EpicListItem } from "../../details/main/collapsible-section/epics/epic-list-item/root";
import { ProjectList } from "../../details/main/collapsible-section/projects/project-list";
import { useInitiativeScopeShared } from "../filters/context-shared";

type Props = {
  epicIds: string[];
  projectIds: string[];
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  isDataLoading?: boolean;
};

export const InitiativeScopeListView = observer(function InitiativeScopeListView(props: Props) {
  const { epicIds, projectIds, workspaceSlug, initiativeId, disabled, isDataLoading } = props;
  const { activeTab } = useInitiativeScopeShared();

  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  const isEmpty = epicIds?.length === 0 && projectIds?.length === 0;

  const resolvedAssetPath = resolvedTheme === "light" ? initiativesListLight : initiativesListDark;

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

  return (
    <div className="h-full w-full overflow-y-auto">
      {/**Epics List */}
      {activeTab === INITIATIVE_SCOPE_TABS.EPICS && (
        <>
          {epicIds?.map((epicId) => (
            <EpicListItem
              key={epicId}
              workspaceSlug={workspaceSlug}
              epicId={epicId}
              initiativeId={initiativeId}
              disabled={disabled}
            />
          ))}
        </>
      )}
      {/**Projects List */}
      {activeTab === INITIATIVE_SCOPE_TABS.PROJECTS && (
        <>
          <ProjectList
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            projectIds={projectIds}
            disabled={disabled}
          />
        </>
      )}
    </div>
  );
});
