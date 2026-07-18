/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Combobox } from "@headlessui/react";
import { LockIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { CheckIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import { useProjectState } from "@/hooks/store/use-project-state";

export type TStateOptionProps = {
  projectId: string | null | undefined;
  option: {
    value: string | undefined;
    query: string;
    content: React.ReactNode;
  };
  selectedValue: string | null | undefined;
  className?: string;
  filterAvailableStateIds?: boolean;
  isForWorkItemCreation?: boolean;
  alwaysAllowStateChange?: boolean;
};

export const StateOption = observer(function StateOption(props: TStateOptionProps) {
  const {
    option,
    className = "",
    projectId,
    selectedValue,
    filterAvailableStateIds = true,
    isForWorkItemCreation = false,
    alwaysAllowStateChange = false,
  } = props;
  const { t } = useTranslation();
  const { getIsTransitionAllowed } = useProjectState();

  const shouldEnforceWorkflow =
    filterAvailableStateIds && !isForWorkItemCreation && !alwaysAllowStateChange && !!selectedValue;
  const isTransitionAllowed = shouldEnforceWorkflow
    ? getIsTransitionAllowed(projectId, selectedValue, option.value)
    : true;

  if (!isTransitionAllowed) {
    return (
      <Tooltip tooltipContent={t("workflows.status_workflow.transition_not_allowed")} position="right">
        <div
          aria-disabled="true"
          className={cn(className, "cursor-not-allowed text-placeholder opacity-60 select-none")}
        >
          <span className="flex-grow truncate">{option.content}</span>
          <LockIcon className="h-3 w-3 flex-shrink-0" />
        </div>
      </Tooltip>
    );
  }

  return (
    <Combobox.Option
      key={option.value}
      value={option.value}
      className={({ active, selected }) =>
        cn(`${className} ${active ? "bg-layer-transparent-hover" : ""} ${selected ? "text-primary" : "text-secondary"}`)
      }
    >
      {({ selected }) => (
        <>
          <span className="flex-grow truncate">{option.content}</span>
          {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
        </>
      )}
    </Combobox.Option>
  );
});
