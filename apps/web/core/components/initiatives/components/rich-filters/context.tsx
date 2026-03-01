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

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FilterInstance } from "@plane/shared-state";
import type { IUserLite } from "@plane/types";
import { useMember } from "@/hooks/store/use-member";
import { useFiltersOperatorConfigs } from "@/plane-web/hooks/rich-filters/use-filters-operator-configs";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TExternalInitiativeFilterExpression, TInitiativeFilterKeys } from "@/types/initiative";
import { InitiativesFilterAdapter } from "./adapter";
import { useInitiativesFilterConfigs } from "./use-initiatives-filter-configs";

type InitiativesFilterContextType = {
  filterInstance: FilterInstance<TInitiativeFilterKeys, TExternalInitiativeFilterExpression> | null;
  workspaceMembers: IUserLite[];
  isReady: boolean;
};

const InitiativesFilterContext = createContext<InitiativesFilterContextType | undefined>(undefined);

const createFilterInstance = (
  filters: TExternalInitiativeFilterExpression,
  onExpressionChange: (expression: TExternalInitiativeFilterExpression) => void
) =>
  new FilterInstance<TInitiativeFilterKeys, TExternalInitiativeFilterExpression>({
    adapter: new InitiativesFilterAdapter(),
    initialExpression: filters,
    onExpressionChange: (expression) => {
      onExpressionChange(expression);
    },
  });

const InitiativesFilterInstanceProvider = observer(function InitiativesFilterInstanceProvider({
  children,
  filters,
  workspaceSlug,
}: {
  children: ReactNode;
  filters: TExternalInitiativeFilterExpression;
  workspaceSlug: string;
}) {
  const {
    initiativeFilters: { updateFilters },
    initiative: { getInitiativesLabels },
  } = useInitiatives();

  const [filterInstance] = useState(() =>
    createFilterInstance(filters, (expression) => {
      updateFilters(workspaceSlug, expression);
    })
  );

  const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug });
  const {
    workspace: { workspaceMemberIds },
    getUserDetails,
  } = useMember();

  const labels = getInitiativesLabels(workspaceSlug);

  const workspaceMembers = useMemo(() => {
    if (!workspaceMemberIds) return [];
    return workspaceMemberIds.map((memberId) => getUserDetails(memberId)).filter(Boolean) as IUserLite[];
  }, [getUserDetails, workspaceMemberIds]);

  const { leadFilterConfig, startDateFilterConfig, endDateFilterConfig, statesFilterConfig, labelsFilterConfig } =
    useInitiativesFilterConfigs({
      workspaceMembers,
      operatorConfigs,
      labels: Array.from(labels?.values() || []),
    });

  // Register all filter configs
  filterInstance.configManager.registerAll([
    leadFilterConfig,
    startDateFilterConfig,
    endDateFilterConfig,
    statesFilterConfig,
    labelsFilterConfig,
  ]);

  const value = useMemo(
    () => ({
      filterInstance,
      workspaceMembers,
      isReady: true,
    }),
    [filterInstance, workspaceMembers]
  );

  return <InitiativesFilterContext.Provider value={value}>{children}</InitiativesFilterContext.Provider>;
});

export const InitiativesFilterProvider = observer(function InitiativesFilterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { workspaceSlug } = useParams();
  const {
    initiativeFilters: { getInitiativeFilters },
  } = useInitiatives();

  const filters = getInitiativeFilters(workspaceSlug?.toString());

  const {
    workspace: { workspaceMemberIds },
    getUserDetails,
  } = useMember();

  const workspaceMembers = useMemo(() => {
    if (!workspaceMemberIds) return [];
    return workspaceMemberIds.map((memberId) => getUserDetails(memberId)).filter(Boolean) as IUserLite[];
  }, [getUserDetails, workspaceMemberIds]);

  const isReady = !!(workspaceSlug && filters);

  const value = useMemo(
    () => ({
      filterInstance: null,
      workspaceMembers,
      isReady: false,
    }),
    [workspaceMembers]
  );

  // If not ready, provide the "not ready" context
  if (!isReady) {
    return <InitiativesFilterContext.Provider value={value}>{children}</InitiativesFilterContext.Provider>;
  }

  // When ready, use the instance provider
  return (
    <InitiativesFilterInstanceProvider filters={filters} workspaceSlug={workspaceSlug.toString()}>
      {children}
    </InitiativesFilterInstanceProvider>
  );
});

export const useInitiativesFilterContext = () => {
  const context = useContext(InitiativesFilterContext);
  if (!context) {
    throw new Error("useInitiativesFilterContext must be used within InitiativesFilterProvider");
  }
  return context;
};
