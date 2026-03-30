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

import { useMember } from "@/hooks/store/use-member";
import { useFiltersOperatorConfigs } from "@/plane-web/hooks/rich-filters/use-filters-operator-configs";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { IUserLite, TExternalProjectFilterExpression, TInitiativeScopeProjectFilterKeys } from "@plane/types";
import { FilterInstance } from "@plane/shared-state";
import { observer } from "mobx-react";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { InitiativeScopeProjectFilterAdapter } from "./adapters";
import { useProjectScopeFilterConfigs } from "./use-scope-filter-configs";

type IInitiativeScopeProjectFilterInstance = FilterInstance<
  TInitiativeScopeProjectFilterKeys,
  TExternalProjectFilterExpression
>;

type InitiativeScopeProjectFilterContextType = {
  filterInstance: IInitiativeScopeProjectFilterInstance | null;
  isReady: boolean;
};

const InitiativeScopeProjectFilterContext = createContext<InitiativeScopeProjectFilterContextType | undefined>(
  undefined
);

const createProjectFilterInstance = (
  initialExpression: TExternalProjectFilterExpression,
  onExpressionChange: (expression: TExternalProjectFilterExpression) => void
) =>
  new FilterInstance<TInitiativeScopeProjectFilterKeys, TExternalProjectFilterExpression>({
    adapter: new InitiativeScopeProjectFilterAdapter(),
    initialExpression,
    onExpressionChange,
  });

type InitiativeScopeProjectFilterInstanceProviderProps = {
  children: ReactNode;
  workspaceSlug: string;
  initiativeId: string;
};

const InitiativeScopeProjectFilterInstanceProvider = observer(function InitiativeScopeProjectFilterInstanceProvider({
  children,
  workspaceSlug,
  initiativeId,
}: InitiativeScopeProjectFilterInstanceProviderProps) {
  const {
    initiative: {
      scope: {
        projects: { filters: projectsFilterStore },
      },
    },
  } = useInitiatives();

  // Get project filter expression
  const projectFiltersData = projectsFilterStore.getInitiativeProjectsFiltersById(initiativeId);
  const projectRichFilters = projectFiltersData?.richFilters ?? {};

  // Create filter instance for projects
  const [filterInstance] = useState(() =>
    createProjectFilterInstance(projectRichFilters, (expression) => {
      projectsFilterStore.updateProjectFilters(workspaceSlug, initiativeId, expression);
    })
  );

  const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug });
  const {
    workspace: { workspaceMemberIds },
    getUserDetails,
  } = useMember();

  const workspaceMembers = useMemo(() => {
    if (!workspaceMemberIds) return [];
    return workspaceMemberIds.map((memberId) => getUserDetails(memberId)).filter(Boolean) as IUserLite[];
  }, [getUserDetails, workspaceMemberIds]);

  const projectFilterConfigs = useProjectScopeFilterConfigs({
    workspaceMembers,
    operatorConfigs,
  });

  // Register project filter configs
  useEffect(() => {
    filterInstance.configManager.setAreConfigsReady(projectFilterConfigs.areAllConfigsInitialized);
    filterInstance.configManager.registerAll(projectFilterConfigs.configs);
  }, [projectFilterConfigs.areAllConfigsInitialized, projectFilterConfigs.configs, filterInstance.configManager]);

  const value = useMemo(
    () => ({
      filterInstance,
      isReady: true,
    }),
    [filterInstance]
  );

  return (
    <InitiativeScopeProjectFilterContext.Provider value={value}>
      {children}
    </InitiativeScopeProjectFilterContext.Provider>
  );
});

type InitiativeScopeProjectFilterProviderProps = {
  children: ReactNode;
  workspaceSlug: string;
  initiativeId: string;
};

export const InitiativeScopeProjectFilterProvider = observer(function InitiativeScopeProjectFilterProvider({
  children,
  workspaceSlug,
  initiativeId,
}: InitiativeScopeProjectFilterProviderProps) {
  const isReady = !!(workspaceSlug && initiativeId);

  const defaultValue = useMemo(
    () => ({
      filterInstance: null,
      isReady: false,
    }),
    []
  );

  if (!isReady) {
    return (
      <InitiativeScopeProjectFilterContext.Provider value={defaultValue}>
        {children}
      </InitiativeScopeProjectFilterContext.Provider>
    );
  }

  return (
    <InitiativeScopeProjectFilterInstanceProvider workspaceSlug={workspaceSlug} initiativeId={initiativeId}>
      {children}
    </InitiativeScopeProjectFilterInstanceProvider>
  );
});

export const useInitiativeScopeProjectFilter = () => {
  const context = useContext(InitiativeScopeProjectFilterContext);
  if (!context) {
    throw new Error("useInitiativeScopeProjectFilter must be used within InitiativeScopeProjectFilterProvider");
  }
  return context;
};
