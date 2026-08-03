/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { API_BASE_URL, EIconSize, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { GitlabIcon, StateGroupIcon, StatePropertyIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomSearchSelect, Loader } from "@plane/ui";
import { SettingsControlItem } from "@/components/settings/control-item";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
import { ProjectGitLabService } from "@/services/project/gitlab.service";
import type { TProjectGitLabConfig } from "@/services/project/gitlab.service";

export type TCustomAutomationsRootProps = {
  projectId: string;
  workspaceSlug: string;
};

export const CustomAutomationsRoot = observer(function CustomAutomationsRoot(props: TCustomAutomationsRootProps) {
  const { projectId, workspaceSlug } = props;
  const { projectStates } = useProjectState();
  const { allowPermissions } = useUserPermissions();
  const [config, setConfig] = useState<TProjectGitLabConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  const stateOptions = useMemo(
    () =>
      (projectStates ?? []).map((state) => ({
        value: state.id,
        query: state.name,
        content: (
          <div className="flex items-center gap-2">
            <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.LG} />
            {state.name}
          </div>
        ),
      })),
    [projectStates]
  );

  useEffect(() => {
    const service = new ProjectGitLabService();
    let cancelled = false;
    setLoading(true);
    service
      .getConfig(workspaceSlug, projectId)
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        if (!cancelled) setConfig(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, projectId]);

  const updateConfig = async (payload: Partial<Pick<TProjectGitLabConfig, "merge_from_state_id" | "merge_to_state_id">>) => {
    if (!isAdmin) return;
    const service = new ProjectGitLabService();
    try {
      const data = await service.updateConfig(workspaceSlug, projectId, payload);
      setConfig(data);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Could not update GitLab automation settings.",
      });
    }
  };

  const fromState = projectStates?.find((s) => s.id === config?.merge_from_state_id);
  const toState = projectStates?.find((s) => s.id === config?.merge_to_state_id);

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-sm bg-layer-2">
            <GitlabIcon width="16" height="16" className="size-4" />
          </div>
          <SettingsControlItem
            title="GitLab merge → status"
            description="When an MR whose title starts with the work item key (e.g. ENG-42) is merged, move the work item from one project state to another."
            control={<span />}
          />
        </div>

        {loading ? (
          <Loader className="ml-13">
            <Loader.Item height="80px" />
          </Loader>
        ) : (
          <div className="ml-13">
            <div className="flex flex-col rounded-sm border border-subtle bg-surface-2">
              <div className="flex w-full items-center justify-between gap-2 px-5 py-4">
                <div className="w-1/2 text-13 font-medium">From state (e.g. Pending for review)</div>
                <div className="w-1/2">
                  <CustomSearchSelect
                    value={config?.merge_from_state_id}
                    label={
                      <div className="flex items-center gap-2">
                        {fromState ? (
                          <StateGroupIcon stateGroup={fromState.group} color={fromState.color} size={EIconSize.LG} />
                        ) : (
                          <StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />
                        )}
                        {fromState?.name ?? <span className="text-secondary">Select state</span>}
                      </div>
                    }
                    onChange={(val: string) => void updateConfig({ merge_from_state_id: val })}
                    options={stateOptions}
                    disabled={!isAdmin}
                    input
                  />
                </div>
              </div>
              <div className="flex w-full items-center justify-between gap-2 px-5 py-4">
                <div className="w-1/2 text-13 font-medium">To state (e.g. Ready to test)</div>
                <div className="w-1/2">
                  <CustomSearchSelect
                    value={config?.merge_to_state_id}
                    label={
                      <div className="flex items-center gap-2">
                        {toState ? (
                          <StateGroupIcon stateGroup={toState.group} color={toState.color} size={EIconSize.LG} />
                        ) : (
                          <StatePropertyIcon className="h-3.5 w-3.5 text-secondary" />
                        )}
                        {toState?.name ?? <span className="text-secondary">Select state</span>}
                      </div>
                    }
                    onChange={(val: string) => void updateConfig({ merge_to_state_id: val })}
                    options={stateOptions}
                    disabled={!isAdmin}
                    input
                  />
                </div>
              </div>
              {config?.webhook_url && (
                <div className="border-t border-subtle px-5 py-4 text-13 text-secondary">
                  GitLab webhook URL:{" "}
                  <code className="text-primary break-all">{`${API_BASE_URL}${config.webhook_url}`}</code>
                  <div className="mt-1">
                    Set env <code>GITLAB_WEBHOOK_SECRET</code> and use the same value as the GitLab webhook secret token.
                    Enable Merge request + Push events. MR titles and commit messages must start with the work item key
                    (e.g. <code>ENG-42 …</code>).
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
});
