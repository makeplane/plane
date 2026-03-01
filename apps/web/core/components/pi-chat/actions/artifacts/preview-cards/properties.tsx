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

import { Dice4, Group, SignalHigh, Tags, User, Users } from "lucide-react";
import { CalendarLayoutIcon, ProjectIcon, ProjectStatesIcon } from "@plane/propel/icons";
import { cn } from "@plane/propel/utils";
import type { TIssuePriorities, TLogoProps, TStateGroups } from "@plane/types";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { ModuleDropdown } from "@/components/dropdowns/module/dropdown";
import { DisplayDates } from "@/components/properties/dates";
import { DisplayLabels } from "@/components/properties/labels";
import { DisplayPriority } from "@/components/properties/priority";
import { DisplayProject } from "@/components/properties/project";
import { DisplayState } from "@/components/properties/state";

function hasAtLeastOneValidKey(obj: Record<string, unknown>) {
  if (typeof obj !== "object" || obj === null) return false;

  return Object.values(obj).some((value: unknown) => {
    if (value === undefined) return false;

    if (typeof value === "object" && value !== null && Object.keys(value).length === 0) {
      return false;
    }

    return true;
  });
}
type TProps = {
  state?: {
    group: TStateGroups;
    color: string;
    name: string;
  };
  priority?: {
    name: TIssuePriorities;
  };
  project?: {
    name: string;
    id: string;
    logo_props?: TLogoProps;
  };
  lead?: string;
  assignees?: {
    id: string;
    name: string;
  }[];
  start_date?: {
    name: string;
  } | null;
  target_date?: {
    name: string;
  } | null;
  moduleIds?: string[];
  labels?: {
    color: string;
    name: string;
  }[];
  showContainer?: boolean;
  group?: {
    name: string;
    color?: string;
  };
};

function PropertyWrapper(props: {
  children: (props: { className: string }) => React.ReactNode;
  title: string;
  Icon?: React.ElementType;
  showContainer: boolean;
}) {
  const { children, title, Icon = ProjectIcon, showContainer } = props;
  if (!showContainer) return <>{children({ className: "" })}</>;
  return (
    <div className="flex gap-2 border-[0.5px] border-subtle-1 rounded-md py-1 px-2">
      <div className="flex gap-1 items-center text-tertiary">
        <Icon className="size-3" strokeWidth={2} />
        <span className="text-13">{title}</span>
      </div>
      <div className="flex text-primary font-medium items-center">
        {children({ className: "text-primary font-medium" })}
      </div>
    </div>
  );
}

export function Properties(props: TProps) {
  const {
    state,
    priority,
    project,
    lead,
    assignees,
    start_date,
    target_date,
    moduleIds,
    labels,
    group,
    showContainer = false,
  } = props;
  if (!hasAtLeastOneValidKey(props)) return null;
  return (
    <div
      className={cn(
        "mt-2 flex items-center flex-wrap gap-2",
        "[&>*:not(:last-child)]:after:content-['']",
        "[&>*:not(:last-child)]:after:inline-block",
        "[&>*:not(:last-child)]:after:w-1 [&>*:not(:last-child)]:after:h-1",
        "[&>*:not(:last-child)]:after:bg-layer-1",
        "[&>*:not(:last-child)]:after:rounded-full",
        "[&>*:not(:last-child)]:after:mx-1",
        "[&>*:not(:last-child)]:after:align-middle",
        "[&>*:not(:last-child)]:after:flex-shrink-0"
      )}
    >
      {project && (
        <PropertyWrapper title="Project" Icon={ProjectIcon} showContainer={showContainer}>
          {({ className }) => <DisplayProject project={project} className={className} />}
        </PropertyWrapper>
      )}
      {state && (
        <PropertyWrapper title="State" Icon={ProjectStatesIcon} showContainer={showContainer}>
          {({ className }) => (
            <DisplayState
              state={{
                group: state.group ?? undefined,
                name: state.name ?? "",
              }}
              className={className}
            />
          )}
        </PropertyWrapper>
      )}
      {group && (
        <PropertyWrapper title="Group" Icon={Group} showContainer={showContainer}>
          {({ className }) => (
            <div className={cn("text-tertiary text-body-sm-regular capitalize", className)}>{group.name}</div>
          )}
        </PropertyWrapper>
      )}
      {priority && (
        <PropertyWrapper title="Priority" Icon={SignalHigh} showContainer={showContainer}>
          {({ className }) => <DisplayPriority priority={priority.name} className={className} />}
        </PropertyWrapper>
      )}
      {lead && (
        <PropertyWrapper title="Lead" Icon={User} showContainer={showContainer}>
          {() => <ButtonAvatars userIds={lead} showTooltip />}
        </PropertyWrapper>
      )}
      {assignees && (
        <PropertyWrapper title="Assignees" Icon={Users} showContainer={showContainer}>
          {(className) => (
            <div className={cn("flex items-center gap-1 text-tertiary", className)}>
              <ButtonAvatars userIds={assignees.map((assignee) => assignee.id)} showTooltip />
            </div>
          )}
        </PropertyWrapper>
      )}
      {(start_date || target_date) && (
        <PropertyWrapper
          title={start_date || target_date ? "Dates" : start_date ? "Start Date" : "Target Date"}
          Icon={CalendarLayoutIcon}
          showContainer={showContainer}
        >
          {({ className }) => (
            <DisplayDates startDate={start_date?.name} endDate={target_date?.name} className={className} />
          )}
        </PropertyWrapper>
      )}

      {moduleIds && project?.id && (
        <PropertyWrapper title="Modules" Icon={Dice4} showContainer={showContainer}>
          {({ className }) => (
            <ModuleDropdown
              projectId={project.id}
              buttonContainerClassName={cn("truncate max-w-40", className)}
              value={moduleIds ?? []}
              onChange={() => {}}
              multiple
              disabled
              renderByDefault
              buttonVariant="border-with-text"
              showCount
              showTooltip
            />
          )}
        </PropertyWrapper>
      )}
      {labels && (
        <PropertyWrapper title="Labels" Icon={Tags} showContainer={showContainer}>
          {({ className }) => <DisplayLabels labels={labels} className={className} />}
        </PropertyWrapper>
      )}
    </div>
  );
}
