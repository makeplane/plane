/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { StateGroupIcon } from "@plane/blocks/icons";
import { EIconSize } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IState, TStateOperationsCallbacks } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { StateItem } from "./state-item";

type TClosedStateGroup = {
  closedState: IState;
  stateOperationsCallbacks: TStateOperationsCallbacks;
  isEditable: boolean;
  groupItemClassName?: string;
  stateItemClassName?: string;
};

/**
 * d2m-plane: ClickUp-like "Closed" block, rendered at the bottom of the States settings.
 * The Closed state belongs to the completed group in the data model but is shown on its own:
 * it can be renamed / recoloured, but not deleted, made default or reordered.
 */
export const ClosedStateGroup = observer(function ClosedStateGroup(props: TClosedStateGroup) {
  const { closedState, stateOperationsCallbacks, isEditable, groupItemClassName, stateItemClassName } = props;
  const { t } = useTranslation();

  return (
    <div className={cn("rounded-sm border border-subtle bg-surface-2", groupItemClassName)}>
      <div className="flex w-full items-center gap-1 px-3 py-2">
        <StateGroupIcon stateGroup="completed" color={closedState.color} size={EIconSize.XL} className="shrink-0" />
        <span className="px-1 text-14 font-medium text-secondary">{t("project_settings.states.closed.title")}</span>
      </div>
      <p className="px-3 pb-2 text-12 text-tertiary">{t("project_settings.states.closed.description")}</p>
      <div className="px-2 pb-2">
        <StateItem
          groupKey="completed"
          groupedStates={{ completed: [closedState] }}
          totalStates={1}
          state={closedState}
          disabled={!isEditable}
          stateOperationsCallbacks={stateOperationsCallbacks}
          stateItemClassName={stateItemClassName}
        />
      </div>
    </div>
  );
});
