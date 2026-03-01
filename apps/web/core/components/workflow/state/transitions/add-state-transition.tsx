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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Spinner } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  workspaceSlug: string;
  projectId: string;
  parentStateId: string;
  onTransitionAdd?: () => void;
};

export const AddStateTransition = observer(function AddStateTransition(props: Props) {
  const { workspaceSlug, projectId, parentStateId, onTransitionAdd } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isAdding, setIsAdding] = useState(false);
  // store hooks
  const { addStateTransition, getAvailableStateTransitionIds } = useProjectState();
  // derived state
  const availableStateTransitionIds = getAvailableStateTransitionIds(projectId, parentStateId, undefined);
  // handlers
  const addNewTransition = async (transitionStateId: string) => {
    setIsAdding(true);
    try {
      await addStateTransition(workspaceSlug, projectId, parentStateId, transitionStateId);
      if (onTransitionAdd) {
        onTransitionAdd();
      }
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflows.toasts.add_state_change_rule.error.title"),
        message: t("workflows.toasts.add_state_change_rule.error.message"),
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={cn("flex px-3 h-10 items-center justify-start gap-2")}>
      <StateDropdown
        button={
          <Button
            variant="secondary"
            className={cn("text-11 px-2 py-1", {
              "cursor-pointer": !isAdding,
            })}
          >
            {isAdding ? (
              <div className="flex gap-1 items-center">
                <Spinner height="15px" width="15px" />
                <span>{t("workflows.workflow_states.state_changes.label.loading")}</span>{" "}
              </div>
            ) : (
              t("workflows.workflow_states.state_changes.label.default")
            )}
          </Button>
        }
        buttonVariant={"transparent-with-text"}
        projectId={projectId}
        onChange={addNewTransition}
        value={undefined}
        showDefaultState={false}
        renderByDefault={false}
        stateIds={availableStateTransitionIds}
        filterAvailableStateIds={false}
      />
    </div>
  );
});
