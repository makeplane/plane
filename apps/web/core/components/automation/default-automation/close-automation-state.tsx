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
import { useTranslation } from "@plane/i18n";
import { EIconSize } from "@plane/constants";
import { StateGroupIcon, StatePropertyIcon } from "@plane/propel/icons";
import { CustomSearchSelect } from "@plane/ui";

import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";

import type { DefaultAutomationContentProps } from "./types";

function CloseAutomationState(props: DefaultAutomationContentProps) {
  const { projectId, handleChange } = props;

  const { getProjectById } = useProject();
  const currentProjectDetails = getProjectById(projectId);

  const { projectStates } = useProjectState();
  const { t } = useTranslation();

  const defaultState = projectStates?.find((s) => s.group === "cancelled")?.id || null;

  const selectedOption = projectStates?.find((s) => s.id === (currentProjectDetails?.default_state ?? defaultState));
  const currentDefaultState = projectStates?.find((s) => s.id === defaultState);

  const options = (projectStates ?? [])
    ?.filter((state) => state.group === "cancelled")
    .map((state) => ({
      value: state.id,
      query: state.name,
      content: (
        <div className="flex items-center gap-2">
          <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.LG} />
          {state.name}
        </div>
      ),
    }));

  const multipleOptions = (options ?? []).length > 1;

  return (
    <div>
      <CustomSearchSelect
        value={currentProjectDetails?.default_state ?? defaultState}
        label={
          <div className="flex items-center gap-2">
            {selectedOption ? (
              <StateGroupIcon stateGroup={selectedOption.group} color={selectedOption.color} size={EIconSize.LG} />
            ) : currentDefaultState ? (
              <StateGroupIcon
                stateGroup={currentDefaultState.group}
                color={currentDefaultState.color}
                size={EIconSize.LG}
              />
            ) : (
              <StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />
            )}
            {selectedOption?.name
              ? selectedOption.name
              : (currentDefaultState?.name ?? <span className="text-secondary">{t("state")}</span>)}
          </div>
        }
        onChange={(val: string) => handleChange?.({ default_state: val })}
        options={options}
        disabled={!multipleOptions}
        input
      />
    </div>
  );
}

export const DefaultCloseAutomationState = observer(CloseAutomationState);
