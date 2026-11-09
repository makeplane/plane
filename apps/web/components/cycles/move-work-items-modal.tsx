/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * "Move work items" on a cycle: every work item of the cycle in the selected states moves to one state, in one batch
 * on the server (one transaction, activity per work item). Also how an admin applies a cycle automation rule to a
 * cycle that already started or completed.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { setToast } from "@plane/blocks/toast";
import { EIssuesStoreType } from "@plane/types";
// components
import { StateMultiSelect, StateSingleSelect } from "@/components/automation/cycle-automation/state-select";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectState } from "@/hooks/store/use-project-state";
// services
import { CycleAutomationService } from "@/services/cycle-automation.service";

const service = new CycleAutomationService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  isOpen: boolean;
  handleClose: () => void;
};

export const MoveCycleWorkItemsModal = observer(function MoveCycleWorkItemsModal(props: Props) {
  const { workspaceSlug, projectId, cycleId, isOpen, handleClose } = props;
  const { t } = useTranslation();
  const { getCycleNameById, fetchCycleDetails } = useCycle();
  const { getProjectStates } = useProjectState();
  const { issues } = useIssues(EIssuesStoreType.CYCLE);
  const states = useMemo(() => getProjectStates(projectId) ?? [], [getProjectStates, projectId]);
  const [fromStateIds, setFromStateIds] = useState<string[]>([]);
  const [toStateId, setToStateId] = useState<string | null>(null);
  const [count, setCount] = useState<number | undefined>(undefined);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (!isOpen || !fromStateIds.length) {
      setCount(undefined);
      return;
    }
    let cancelled = false;
    service
      .countInStates(workspaceSlug, projectId, cycleId, fromStateIds)
      .then((value) => !cancelled && setCount(value))
      .catch(() => !cancelled && setCount(undefined));
    return () => {
      cancelled = true;
    };
  }, [isOpen, workspaceSlug, projectId, cycleId, fromStateIds]);

  const onClose = () => {
    setFromStateIds([]);
    setToStateId(null);
    setCount(undefined);
    setIsMoving(false);
    handleClose();
  };

  const onMove = async () => {
    if (!toStateId || !fromStateIds.length) return;
    setIsMoving(true);
    try {
      const result = await service.moveStates(workspaceSlug, projectId, cycleId, fromStateIds, toStateId);
      // one refetch of the open cycle list and its progress
      await Promise.all([
        issues.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation", cycleId),
        fetchCycleDetails(workspaceSlug, projectId, cycleId),
      ]).catch(() => undefined);
      setToast({ type: "success", title: t("cycle_automation.move.success", { count: result.updated.length }) });
      onClose();
    } catch {
      setToast({ type: "error", title: t("cycle_automation.move.error") });
      setIsMoving(false);
    }
  };

  const targets = states.filter((state) => !fromStateIds.includes(state.id));
  const canMove = !!toStateId && fromStateIds.length > 0 && !fromStateIds.includes(toStateId) && count !== 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="md">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{t("cycle_automation.move.title", { cycle: getCycleNameById(cycleId) ?? "" })}</DialogTitle>
              <DialogDescription>{t("cycle_automation.move.description")}</DialogDescription>
            </DialogHeading>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body-xs-regular text-secondary">{t("cycle_automation.from")}</span>
                <div className="w-52">
                  <StateMultiSelect
                    states={states}
                    value={fromStateIds}
                    onChange={setFromStateIds}
                    placeholder={t("cycle_automation.select_states")}
                  />
                </div>
                <span className="text-body-xs-regular text-secondary">{t("cycle_automation.to")}</span>
                <div className="w-48">
                  <StateSingleSelect
                    states={targets}
                    value={toStateId}
                    onChange={setToStateId}
                    placeholder={t("cycle_automation.select_state")}
                  />
                </div>
              </div>
              {count !== undefined && (
                <p className="text-body-xs-regular text-secondary">{t("cycle_automation.move.count", { count })}</p>
              )}
            </div>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button variant="secondary" size="md" stretch="auto" label={t("cancel")} onClick={onClose} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={t("cycle_automation.move.submit")}
            loading={isMoving}
            disabled={!canMove}
            onClick={() => void onMove()}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
});
