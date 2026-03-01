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

import { useMemo } from "react";
import { CalendarCheck2, CalendarClock, Tags, Users } from "lucide-react";
import { INITIATIVE_STATES } from "@plane/constants";
import { InitiativeStateIcon } from "@plane/propel/icons";
import type { IUserLite, TInitiativeLabel } from "@plane/types";
import { Avatar } from "@plane/ui";
import {
  getInitiativeLeadFilterConfig,
  getInitiativeStartDateFilterConfig,
  getInitiativeEndDateFilterConfig,
  getInitiativeStatesFilterConfig,
  getFileURL,
  getInitiativeLabelsFilterConfig,
} from "@plane/utils";
import type { TFiltersOperatorConfigs } from "@/ce/hooks/rich-filters/use-filters-operator-configs";

interface UseInitiativesFilterConfigsProps {
  workspaceMembers: IUserLite[];
  operatorConfigs: TFiltersOperatorConfigs;
  labels: TInitiativeLabel[];
}

export const useInitiativesFilterConfigs = ({
  workspaceMembers,
  operatorConfigs,
  labels,
}: UseInitiativesFilterConfigsProps) => {
  const leadFilterConfig = useMemo(
    () =>
      getInitiativeLeadFilterConfig("lead")({
        isEnabled: true,
        filterIcon: Users,
        members: workspaceMembers,
        getOptionIcon: (member: IUserLite) => (
          <Avatar src={getFileURL(member.avatar_url)} name={member.display_name} size="sm" />
        ),
        ...operatorConfigs,
      }),
    [workspaceMembers, operatorConfigs]
  );

  const startDateFilterConfig = useMemo(
    () =>
      getInitiativeStartDateFilterConfig("start_date")({
        isEnabled: true,
        filterIcon: CalendarClock,
        ...operatorConfigs,
      }),
    [operatorConfigs]
  );

  const endDateFilterConfig = useMemo(
    () =>
      getInitiativeEndDateFilterConfig("end_date")({
        isEnabled: true,
        filterIcon: CalendarCheck2,
        ...operatorConfigs,
      }),
    [operatorConfigs]
  );

  const statesFilterConfig = useMemo(
    () =>
      getInitiativeStatesFilterConfig("state")({
        isEnabled: true,
        filterIcon: () => <InitiativeStateIcon state="DRAFT" />,
        items: Object.values(INITIATIVE_STATES).map((state) => ({
          key: state.key,
          title: state.title,
          icon: () => <InitiativeStateIcon state={state.key} />,
        })),
        getOptionIcon: (state) => <InitiativeStateIcon state={state} />,
        ...operatorConfigs,
      }),
    [operatorConfigs]
  );

  const labelsFilterConfig = useMemo(
    () =>
      getInitiativeLabelsFilterConfig("label_id")({
        isEnabled: true,
        filterIcon: Tags,
        labels: labels,
        getOptionIcon: (color: string) => (
          <span className="flex flex-shrink-0 size-2.5 rounded-full" style={{ backgroundColor: color }} />
        ),
        ...operatorConfigs,
      }),
    [labels, operatorConfigs]
  );

  return {
    leadFilterConfig,
    startDateFilterConfig,
    endDateFilterConfig,
    statesFilterConfig,
    labelsFilterConfig,
  };
};
