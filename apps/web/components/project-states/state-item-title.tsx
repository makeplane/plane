/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { SetStateAction } from "react";
import { observer } from "mobx-react";
import { Badge } from "@makeplane/propel/components/badge";
import { DragDropOutline } from "@makeplane/propel/icons";
// plane imports
import { StateGroupIcon } from "@plane/blocks/icons";
import { useTranslation } from "@plane/i18n";
import type { IState, TStateOperationsCallbacks } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { useProjectState } from "@/hooks/store/use-project-state";
import { StateQuickActions } from "./options";

type TBaseStateItemTitleProps = {
  stateCount: number;
  state: IState;
  shouldShowDescription?: boolean;
  setUpdateStateModal: (value: SetStateAction<boolean>) => void;
};

type TEnabledStateItemTitleProps = TBaseStateItemTitleProps & {
  disabled: false;
  stateOperationsCallbacks: Pick<TStateOperationsCallbacks, "markStateAsDefault" | "deleteState">;
};

type TDisabledStateItemTitleProps = TBaseStateItemTitleProps & {
  disabled: true;
};

export type TStateItemTitleProps = TEnabledStateItemTitleProps | TDisabledStateItemTitleProps;

export const StateItemTitle = observer(function StateItemTitle(props: TStateItemTitleProps) {
  const { stateCount, setUpdateStateModal, disabled, state, shouldShowDescription = true } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getStatePercentageInGroup } = useProjectState();
  // derived values
  const statePercentage = getStatePercentageInGroup(state.id);
  const percentage = statePercentage ? statePercentage / 100 : undefined;
  const hasDescription = shouldShowDescription && !!state.description && state.description.trim() !== "";

  return (
    <div className={cn("flex w-full items-center justify-between gap-2", { "items-start": hasDescription })}>
      <div className={cn("flex items-center gap-2", { "items-start": hasDescription })}>
        {/* drag handle */}
        {!disabled && stateCount != 1 && (
          <div className="absolute top-1/2 -left-1.5 hidden -translate-y-1/2 items-center justify-center rounded-sm border border-subtle bg-layer-2 py-0.5 text-secondary transition-colors group-hover:flex hover:bg-layer-2-hover hover:text-primary">
            <DragDropOutline className="size-3" />
          </div>
        )}
        {/* state icon */}
        <StateGroupIcon
          stateGroup={state.group}
          color={state.color}
          size="lg"
          percentage={percentage}
          className={cn({ "mt-1": hasDescription })}
        />
        {/* state title and description */}
        <div>
          <h6 className="text-body-sm-medium">{state.name}</h6>
          {hasDescription && <p className="text-caption-sm-regular text-secondary">{state.description}</p>}
        </div>
      </div>
      <div className={cn("flex shrink-0 items-center gap-2", { "mt-1": hasDescription })}>
        {state.default && <Badge size="xs" variant="neutral" label={t("common.default")} />}
        {!disabled && (
          <StateQuickActions
            totalStates={stateCount}
            state={state}
            onEdit={() => setUpdateStateModal(true)}
            stateOperationsCallbacks={props.stateOperationsCallbacks}
          />
        )}
      </div>
    </div>
  );
});
