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

import { useCallback, useMemo } from "react";
// plane imports
import { ISSUE_PRIORITIES } from "@plane/constants";
import { DueDatePropertyIcon, PriorityIcon, StartDatePropertyIcon, StateGroupIcon } from "@plane/propel/icons";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { EAutomationChangePropertyType, EAutomationChangeType } from "@plane/types";
import type { ICustomSearchSelectOption, IUserLite, TFilterOptionsType } from "@plane/types";
import { Avatar } from "@plane/propel/avatar";
import { getFileURL, renderFormattedDate } from "@plane/utils";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useAutomations } from "../store/automations/use-automations";

export enum EConfigurationComponentType {
  SINGLE_SELECT = "single_select",
  MULTI_SELECT = "multi_select",
  DATE_PICKER = "date_picker",
}

type TCustomSearchSelectOptionGroup = {
  id: string;
  label: React.ReactNode;
  options: ICustomSearchSelectOption[];
};

type TSingleSelectConfiguration = {
  component_type: EConfigurationComponentType.SINGLE_SELECT;
} & (
  | {
      optionsType: Extract<TFilterOptionsType, "flat-list">;
      options: ICustomSearchSelectOption[];
    }
  | {
      optionsType: Extract<TFilterOptionsType, "group">;
      groups: TCustomSearchSelectOptionGroup[];
    }
);

type TMultiSelectConfiguration = {
  component_type: EConfigurationComponentType.MULTI_SELECT;
} & (
  | {
      optionsType: Extract<TFilterOptionsType, "flat-list">;
      options: ICustomSearchSelectOption[];
    }
  | {
      optionsType: Extract<TFilterOptionsType, "group">;
      groups: TCustomSearchSelectOptionGroup[];
    }
);

type TDatePickerConfiguration = {
  component_type: EConfigurationComponentType.DATE_PICKER;
  minDate?: Date;
  maxDate?: Date;
};

type TComponentConfiguration = TSingleSelectConfiguration | TMultiSelectConfiguration | TDatePickerConfiguration;

export type TChangePropertyConfiguration = {
  supported_change_types: EAutomationChangeType[];
  getPreviewContent: (value: string[]) => React.ReactNode;
} & TComponentConfiguration;

type TChangePropertyConfigurationMap = {
  [K in EAutomationChangePropertyType]: TChangePropertyConfiguration;
};

type TArgs = {
  automationId: string;
};

export const useAutomationActionConfig = (args: TArgs) => {
  const { automationId } = args;
  // store hooks
  const { getAutomationById } = useAutomations();
  const { getProjectById } = useProject();
  const { getProjectStates } = useProjectState();
  const {
    getUserDetails,
    project: { getProjectMemberIds },
  } = useMember();
  const { getProjectLabels } = useLabel();
  // derived values
  const automation = getAutomationById(automationId);
  const projectIds = useMemo(() => automation?.project_ids ?? [], [automation?.project_ids]);
  const isGlobal = !!automation?.is_global;

  // ---- Group label with project logo ----

  const getProjectGroupLabel = useCallback(
    (projectId: string): React.ReactNode => {
      const projectDetails = getProjectById(projectId);
      return (
        <span className="flex items-center gap-1.5 truncate">
          <span className="shrink-0 size-4 grid place-items-center">
            <Logo logo={projectDetails?.logo_props} size={16} />
          </span>
          {projectDetails?.name}
        </span>
      );
    },
    [getProjectById]
  );

  // ---- Grouped options — one group per project ----

  const stateGroups = useMemo<TCustomSearchSelectOptionGroup[]>(
    () =>
      projectIds.map((projectId) => ({
        id: projectId,
        label: getProjectGroupLabel(projectId),
        options: (getProjectStates(projectId) ?? []).map((state) => ({
          value: state.id,
          query: state.name,
          content: (
            <div className="flex items-center gap-2">
              <StateGroupIcon stateGroup={state.group} color={state.color} />
              <span className="grow truncate">{state.name}</span>
            </div>
          ),
        })),
      })),
    [projectIds, getProjectGroupLabel, getProjectStates]
  );

  const labelGroups = useMemo<TCustomSearchSelectOptionGroup[]>(
    () =>
      projectIds.map((projectId) => ({
        id: projectId,
        label: getProjectGroupLabel(projectId),
        options: (getProjectLabels(projectId) ?? []).map((label) => ({
          value: label.id,
          query: label.name,
          content: (
            <div className="flex items-center justify-start gap-2 overflow-hidden">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
              <div className="line-clamp-1 inline-block truncate">{label.name}</div>
            </div>
          ),
        })),
      })),
    [projectIds, getProjectGroupLabel, getProjectLabels]
  );

  const memberGroups = useMemo<TCustomSearchSelectOptionGroup[]>(
    () =>
      projectIds.map((projectId) => ({
        id: projectId,
        label: getProjectGroupLabel(projectId),
        options: (getProjectMemberIds(projectId, false) ?? [])
          .map((userId) => {
            const user = getUserDetails(userId);
            if (!user) return null;
            return {
              value: user.id,
              query: user.display_name,
              content: (
                <div className="flex items-center gap-2">
                  <Avatar name={user.display_name} src={getFileURL(user.avatar_url)} showTooltip={false} />
                  {user.display_name}
                </div>
              ),
            };
          })
          .filter((m): m is NonNullable<typeof m> => !!m),
      })),
    [projectIds, getProjectGroupLabel, getProjectMemberIds, getUserDetails]
  );

  // ---- Action configs ----

  const stateConfig: TChangePropertyConfiguration = useMemo(() => {
    const selectProps = isGlobal
      ? { optionsType: "group" as const, groups: stateGroups }
      : { optionsType: "flat-list" as const, options: stateGroups[0]?.options ?? [] };

    return {
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.SINGLE_SELECT,
      ...selectProps,
      getPreviewContent: (value: string[]) => {
        const allStates = projectIds.flatMap((id) => getProjectStates(id) ?? []);
        const state = allStates.find((s) => s.id === value[0]);
        if (!state) return null;
        return (
          <div className="shrink-0 inline-flex items-center gap-2 bg-layer-1 rounded-sm px-1 py-0.5">
            <StateGroupIcon stateGroup={state.group} color={state.color} />
            <span className="grow truncate">{state.name}</span>
          </div>
        );
      },
    };
  }, [isGlobal, stateGroups, projectIds, getProjectStates]);

  const priorityConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.SINGLE_SELECT,
      optionsType: "flat-list",
      options: ISSUE_PRIORITIES.map((priority) => ({
        value: priority.key,
        query: priority.key,
        content: (
          <div className="flex items-center gap-2">
            <PriorityIcon priority={priority.key} size={14} withContainer />
            <span className="grow truncate">{priority.title}</span>
          </div>
        ),
      })),
      getPreviewContent: (value: string[]) => {
        const priority = ISSUE_PRIORITIES.find((priority) => priority.key === value[0]);
        if (!priority) return null;
        return (
          <div className="shrink-0 inline-flex items-center gap-2 bg-layer-1 rounded-sm px-1 py-0.5">
            <PriorityIcon priority={priority.key} size={14} withContainer />
            <span className="grow truncate">{priority.title}</span>
          </div>
        );
      },
    }),
    []
  );

  const assigneeConfig: TChangePropertyConfiguration = useMemo(() => {
    const selectProps = isGlobal
      ? { optionsType: "group" as const, groups: memberGroups }
      : { optionsType: "flat-list" as const, options: memberGroups[0]?.options ?? [] };

    return {
      supported_change_types: [EAutomationChangeType.ADD, EAutomationChangeType.REMOVE],
      component_type: EConfigurationComponentType.MULTI_SELECT,
      ...selectProps,
      getPreviewContent: (value: string[]) => {
        const members = value.map((id) => getUserDetails(id)).filter((m): m is IUserLite => !!m);
        return (
          <>
            {members.map((member, index) => (
              <div key={member.id} className="shrink-0">
                <div className="inline-flex items-center gap-2 bg-layer-1 rounded-sm px-1 py-0.5">
                  <Avatar
                    name={member.display_name}
                    src={getFileURL(member.avatar_url)}
                    showTooltip={false}
                    size="sm"
                  />
                  {member.display_name}
                </div>
                {index !== members.length - 1 && <span className="mr-1">,</span>}
              </div>
            ))}
          </>
        );
      },
    };
  }, [isGlobal, memberGroups, getUserDetails]);

  const labelsConfig: TChangePropertyConfiguration = useMemo(() => {
    const selectProps = isGlobal
      ? { optionsType: "group" as const, groups: labelGroups }
      : { optionsType: "flat-list" as const, options: labelGroups[0]?.options ?? [] };

    return {
      supported_change_types: [EAutomationChangeType.ADD, EAutomationChangeType.REMOVE],
      component_type: EConfigurationComponentType.MULTI_SELECT,
      ...selectProps,
      getPreviewContent: (value: string[]) => {
        const allLabels = projectIds.flatMap((id) => getProjectLabels(id) ?? []);
        const labels = value
          .map((id) => allLabels.find((label) => label.id === id))
          .filter((l): l is NonNullable<typeof l> => !!l);
        return (
          <>
            {labels.map((label, index) => (
              <div key={label.id} className="shrink-0">
                <div className="inline-flex items-center gap-2 bg-layer-1 rounded-sm px-1 py-0.5">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
                  <span className="grow truncate">{label.name}</span>
                </div>
                {index !== labels.length - 1 && <span className="mr-1">,</span>}
              </div>
            ))}
          </>
        );
      },
    };
  }, [isGlobal, labelGroups, projectIds, getProjectLabels]);

  const startDateConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.DATE_PICKER,
      minDate: new Date(),
      getPreviewContent: (value: string[]) => (
        <div className="shrink-0 inline-flex items-center gap-2 bg-layer-1 rounded-sm px-1 py-0.5">
          <StartDatePropertyIcon className="shrink-0 size-3.5" />
          <span className="grow truncate">{renderFormattedDate(value[0] ?? "")}</span>
        </div>
      ),
    }),
    []
  );

  const dueDateConfig: TChangePropertyConfiguration = useMemo(
    () => ({
      supported_change_types: [EAutomationChangeType.UPDATE],
      component_type: EConfigurationComponentType.DATE_PICKER,
      minDate: new Date(),
      getPreviewContent: (value: string[]) => (
        <div className="shrink-0 inline-flex items-center gap-2 bg-layer-1 rounded-sm px-1 py-0.5">
          <DueDatePropertyIcon className="shrink-0 size-3.5" />
          <span className="grow truncate">{renderFormattedDate(value[0] ?? "")}</span>
        </div>
      ),
    }),
    []
  );

  const configurationMap: TChangePropertyConfigurationMap = useMemo(
    () => ({
      [EAutomationChangePropertyType.STATE]: stateConfig,
      [EAutomationChangePropertyType.PRIORITY]: priorityConfig,
      [EAutomationChangePropertyType.ASSIGNEE]: assigneeConfig,
      [EAutomationChangePropertyType.LABELS]: labelsConfig,
      [EAutomationChangePropertyType.START_DATE]: startDateConfig,
      [EAutomationChangePropertyType.DUE_DATE]: dueDateConfig,
    }),
    [stateConfig, priorityConfig, assigneeConfig, labelsConfig, startDateConfig, dueDateConfig]
  );

  return {
    configurationMap,
  };
};
