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
import { observer } from "mobx-react";
import { CheckIcon, MilestoneIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Combobox } from "@plane/propel/combobox";
import { cn, getMilestoneIconProps } from "@plane/utils";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";

type Props = {
  projectId: string;
  value?: string;
  onChange: (milestoneId: string | undefined) => void;
  disabled?: boolean;
  buttonClassName?: string;
  placeholder?: string;
  readonly?: boolean;
};

export const MilestonesDropdown = observer(function MilestonesDropdown(props: Props) {
  const {
    projectId,
    value,
    disabled = false,
    buttonClassName = "",
    placeholder = "No milestone",
    readonly = false,
    onChange,
  } = props;

  // plane hooks
  const { t } = useTranslation();
  const { getProjectMilestoneIds, getMilestoneById } = useMilestones();

  // derived values
  const projectMilestoneIds = getProjectMilestoneIds(projectId);
  const projectMilestones = projectMilestoneIds?.map((milestoneId) => getMilestoneById(projectId, milestoneId));

  // Memoize milestone options to avoid recreating on every render
  const milestoneOptions = useMemo(
    () => [
      // None option
      {
        value: "none",
        query: "None",
        content: (
          <div className="flex items-center gap-1">
            <MilestoneIcon className="size-4 shrink-0 text-primary" />
            <span className="grow truncate text-left">No milestone</span>
          </div>
        ),
        progress_percentage: 0,
      },
      // Milestone options
      ...(projectMilestones
        ?.filter((milestone) => milestone)
        .map((milestone) => ({
          value: milestone!.id,
          query: milestone!.title,
          content: (
            <div className="flex items-center gap-1">
              <MilestoneIcon className="size-4 shrink-0" {...getMilestoneIconProps(milestone!.progress_percentage)} />
              <span className="grow truncate text-left">{milestone!.title}</span>
            </div>
          ),
          progress_percentage: milestone!.progress_percentage,
        })) || []),
    ],
    [projectMilestones]
  );

  const handleChange = (newValue: string | string[]) => {
    if (typeof newValue === "string") {
      onChange(newValue === "none" ? undefined : newValue);
    }
  };

  const selectedMilestone = value ? milestoneOptions.find((option) => option.value === value) : null;

  return (
    <Combobox
      value={value || "none"}
      onValueChange={(value) => handleChange(value ?? "")}
      disabled={disabled || readonly}
    >
      <Combobox.Button
        className={cn(
          "h-full w-full flex items-center gap-1.5 rounded-sm py-0.5 hover:bg-layer-transparent-hover text-body-xs-regular text-tertiary",
          buttonClassName
        )}
        disabled={disabled || readonly}
      >
        <>
          {selectedMilestone ? (
            <>
              {value && (
                <MilestoneIcon
                  className="size-4 shrink-0"
                  {...getMilestoneIconProps(selectedMilestone.progress_percentage)}
                />
              )}
              <span className="flex-shrink-0 text-body-xs-regular truncate">{selectedMilestone.query}</span>
            </>
          ) : (
            <span className="flex-shrink-0 text-body-xs-regular text-placeholder">{placeholder}</span>
          )}
        </>
      </Combobox.Button>
      <Combobox.Options
        showSearch
        searchPlaceholder={t("search")}
        emptyMessage={t("no_matching_results")}
        maxHeight="md"
        className="w-48 rounded-sm border-[0.5px] border-subtle-1 bg-surface-1 px-2 py-2.5 text-body-xs-regular shadow-raised-200"
        inputClassName="w-full bg-transparent py-1 text-body-xs-regular text-secondary placeholder:text-placeholder focus:outline-none"
        optionsContainerClassName="mt-2 space-y-1"
        positionerClassName="z-50"
        dataPreventOutsideClick
      >
        {milestoneOptions.map((option) => (
          <Combobox.Option
            key={option.value}
            value={option.value}
            className="w-full truncate flex items-center justify-between gap-2 rounded-sm cursor-pointer select-none px-1 py-1.5 hover:bg-layer-1 data-[selected]:text-primary text-caption-sm-medium text-secondary"
          >
            <span className="grow truncate">{option.content}</span>
            {option.value === (value || "none") && <CheckIcon className="size-4 shrink-0" />}
          </Combobox.Option>
        ))}
      </Combobox.Options>
    </Combobox>
  );
});
