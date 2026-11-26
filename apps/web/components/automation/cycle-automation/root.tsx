/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Project settings > Automations > Cycle automation. An ordered list of rules: when a cycle starts or completes, move
 * its work items from some states to one state. Rules of one trigger run in this order, each seeing the result of the
 * previous one. Admins edit; the page itself is admin only.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
import { ChevronDownOutline, ChevronUpOutline, DeleteOutline, RepeatOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Switch } from "@makeplane/propel/components/switch";
import { Select } from "@plane/blocks/select";
import { setToast } from "@plane/blocks/toast";
import type { IState } from "@plane/types";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// services
import { CycleAutomationService } from "@/services/cycle-automation.service";
import type {
  TCycleAutomationRule,
  TCycleAutomationRulePayload,
  TCycleAutomationTrigger,
} from "@/services/cycle-automation.service";
// local imports
import { StateMultiSelect, StateSingleSelect } from "./state-select";

const service = new CycleAutomationService();
const TRIGGERS: TCycleAutomationTrigger[] = ["cycle_started", "cycle_completed"];

const byName = (states: IState[], name: string) =>
  states.find((state) => state.name.trim().toLowerCase() === name.toLowerCase());

/** The preset rules: on start Backlog -> Todo, on completion Testing Complete -> Done (null when a state is missing). */
const buildPreset = (states: IState[], which: "start" | "complete"): TCycleAutomationRulePayload | null => {
  if (which === "start") {
    const from = states.filter((state) => state.group === "backlog").map((state) => state.id);
    const to = byName(states, "Todo") ?? states.find((state) => state.group === "unstarted");
    if (!from.length || !to) return null;
    return { trigger: "cycle_started", from_state_ids: from, to_state_id: to.id, is_enabled: false };
  }
  const from = byName(states, "Testing Complete");
  const to = byName(states, "Done") ?? states.find((state) => state.group === "completed");
  if (!from || !to || from.id === to.id) return null;
  return { trigger: "cycle_completed", from_state_ids: [from.id], to_state_id: to.id, is_enabled: false };
};

type Props = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const CycleAutomation = observer(function CycleAutomation(props: Props) {
  const { workspaceSlug, projectId, isAdmin } = props;
  const { t } = useTranslation();
  const { projectStates } = useProjectState();
  const states = useMemo(() => projectStates ?? [], [projectStates]);
  const [rules, setRules] = useState<TCycleAutomationRule[] | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const showError = useCallback(
    (key: "load" | "save", err?: unknown) => {
      const detail =
        err && typeof err === "object" ? Object.values(err as Record<string, unknown>).flat()[0] : undefined;
      setToast({
        type: "error",
        title: t(`cycle_automation.errors.${key}`),
        message: typeof detail === "string" ? detail : undefined,
      });
    },
    [t]
  );

  useEffect(() => {
    let cancelled = false;
    service
      .listRules(workspaceSlug, projectId)
      .then((list) => !cancelled && setRules(list))
      .catch(() => !cancelled && showError("load"));
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, projectId, showError]);

  const sorted = useMemo(() => sortBy(rules ?? [], "sort_order"), [rules]);
  const triggerOptions = useMemo(
    () => TRIGGERS.map((trigger) => ({ id: trigger, label: t(`cycle_automation.trigger.${trigger}`) })),
    [t]
  );

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      showError("save", err);
    } finally {
      setBusy(false);
    }
  };

  const createRule = (payload: TCycleAutomationRulePayload) =>
    run(async () => {
      const last = sorted[sorted.length - 1];
      const created = await service.createRule(workspaceSlug, projectId, {
        ...payload,
        sort_order: (last?.sort_order ?? 0) + 1000,
      });
      setRules((list) => [...(list ?? []), created]);
    });

  const updateRule = (rule: TCycleAutomationRule, payload: TCycleAutomationRulePayload) =>
    run(async () => {
      const updated = await service.updateRule(workspaceSlug, projectId, rule.id, payload);
      setRules((list) => list?.map((item) => (item.id === updated.id ? updated : item)));
    });

  const deleteRule = (rule: TCycleAutomationRule) =>
    run(async () => {
      await service.deleteRule(workspaceSlug, projectId, rule.id);
      setRules((list) => list?.filter((item) => item.id !== rule.id));
    });

  const swap = (index: number, other: number) =>
    run(async () => {
      const a = sorted[index];
      const b = sorted[other];
      if (!a || !b) return;
      const [updatedA, updatedB] = await Promise.all([
        service.updateRule(workspaceSlug, projectId, a.id, { sort_order: b.sort_order }),
        service.updateRule(workspaceSlug, projectId, b.id, { sort_order: a.sort_order }),
      ]);
      setRules((list) =>
        list?.map((item) => (item.id === updatedA.id ? updatedA : item.id === updatedB.id ? updatedB : item))
      );
    });

  const startPreset = buildPreset(states, "start");
  const completePreset = buildPreset(states, "complete");
  const disabled = !isAdmin || busy;

  return (
    <div>
      <SettingsBoxedControlItem
        icon={<RepeatOutline className="size-4 shrink-0 text-secondary" />}
        title={t("cycle_automation.title")}
        description={t("cycle_automation.description")}
        className="rounded-b-none"
      />
      <div className="flex flex-col gap-3 rounded-b-lg border border-t-0 border-subtle bg-layer-1 p-4">
        {rules !== undefined && sorted.length === 0 && (
          <p className="text-body-xs-regular text-tertiary">{t("cycle_automation.empty")}</p>
        )}
        {sorted.map((rule, index) => {
          const trigger = triggerOptions.find((option) => option.id === rule.trigger) ?? null;
          return (
            <div
              key={rule.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-2"
            >
              <div className="w-44">
                <Select<{ id: TCycleAutomationTrigger; label: string }>
                  getValues={() => triggerOptions}
                  value={trigger}
                  onChange={(value) => void updateRule(rule, { trigger: value as TCycleAutomationTrigger })}
                  getOptionValue={(option) => option.id}
                  getOptionLabel={(option) => option.label}
                  disabled={disabled}
                >
                  <Select.Trigger variant="select-md" disabled={disabled}>
                    <Select.Value />
                  </Select.Trigger>
                </Select>
              </div>
              <span className="text-body-xs-regular text-secondary">{t("cycle_automation.from")}</span>
              <div className="w-48">
                <StateMultiSelect
                  states={states}
                  value={rule.from_state_ids}
                  onChange={(value) => value.length && void updateRule(rule, { from_state_ids: value })}
                  placeholder={t("cycle_automation.select_states")}
                  disabled={disabled}
                />
              </div>
              <span className="text-body-xs-regular text-secondary">{t("cycle_automation.to")}</span>
              <div className="w-44">
                <StateSingleSelect
                  states={states}
                  value={rule.to_state_id}
                  onChange={(value) => void updateRule(rule, { to_state_id: value })}
                  placeholder={t("cycle_automation.select_state")}
                  disabled={disabled}
                />
              </div>
              <div className="ml-auto flex items-center gap-1">
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<Icon icon={ChevronUpOutline} />}
                  aria-label={t("cycle_automation.move_up")}
                  disabled={disabled || index === 0}
                  onClick={() => void swap(index, index - 1)}
                />
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<Icon icon={ChevronDownOutline} />}
                  aria-label={t("cycle_automation.move_down")}
                  disabled={disabled || index === sorted.length - 1}
                  onClick={() => void swap(index, index + 1)}
                />
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<Icon icon={DeleteOutline} />}
                  aria-label={t("cycle_automation.delete")}
                  disabled={disabled}
                  onClick={() => void deleteRule(rule)}
                />
                <Switch
                  size="md"
                  checked={rule.is_enabled}
                  onCheckedChange={() => void updateRule(rule, { is_enabled: !rule.is_enabled })}
                  disabled={disabled}
                  aria-label={t("cycle_automation.title")}
                />
              </div>
            </div>
          );
        })}
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="md"
              stretch="auto"
              label={t("cycle_automation.add_rule")}
              disabled={disabled || states.length < 2}
              onClick={() => {
                const first = states.find((state) => state.group === "backlog") ?? states[0];
                const target = states.find((state) => state.id !== first?.id);
                if (first && target)
                  void createRule({
                    trigger: "cycle_started",
                    from_state_ids: [first.id],
                    to_state_id: target.id,
                    is_enabled: false,
                  });
              }}
            />
            <Button
              variant="secondary"
              size="md"
              stretch="auto"
              label={t("cycle_automation.presets.start")}
              disabled={disabled || !startPreset}
              title={startPreset ? undefined : t("cycle_automation.presets.missing")}
              onClick={() => startPreset && void createRule(startPreset)}
            />
            <Button
              variant="secondary"
              size="md"
              stretch="auto"
              label={t("cycle_automation.presets.complete")}
              disabled={disabled || !completePreset}
              title={completePreset ? undefined : t("cycle_automation.presets.missing")}
              onClick={() => completePreset && void createRule(completePreset)}
            />
          </div>
        )}
      </div>
    </div>
  );
});
