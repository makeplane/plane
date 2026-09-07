/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Deployment history.
 *
 * The record of what actually went out, which Workspaces otherwise has no opinion
 * about. Timestamps are set by the API from the status change rather than
 * typed in — a history whose times were typed by hand is not a history.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { Plus } from "lucide-react";
// workspaces imports
import { Button } from "@workspaces/propel/button";
import { setToast, TOAST_TYPE } from "@workspaces/propel/toast";
import { EModalWidth, ModalCore } from "@workspaces/ui";
import { cn } from "@workspaces/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
// services
import {
  operationsService,
  type TDeployment,
  type TDeploymentEnvironment,
  type TDeploymentPayload,
  type TDeploymentStatus,
} from "@/services/operations";
// local imports
import { EmptyPanel, ErrorPanel, LoadingPanel, Pill, Section, formatDateTime } from "./common";
import { DEPLOYMENT_ENVIRONMENT_LABEL, DEPLOYMENT_STATUS_CLASS, DEPLOYMENT_STATUS_LABEL } from "./constants";
import { OperationsMember } from "./member";

const ENVIRONMENTS = Object.keys(DEPLOYMENT_ENVIRONMENT_LABEL) as TDeploymentEnvironment[];
const STATUSES = Object.keys(DEPLOYMENT_STATUS_LABEL) as TDeploymentStatus[];

type ModalProps = {
  workspaceSlug: string;
  deployment?: TDeployment | null;
  onClose: () => void;
  onSaved: () => void;
};

export const DeploymentModal = observer(function DeploymentModal({
  workspaceSlug,
  deployment,
  onClose,
  onSaved,
}: ModalProps) {
  const { joinedProjectIds, getProjectById } = useProject();
  const [projectId, setProjectId] = useState(deployment?.project ?? joinedProjectIds[0] ?? "");
  const [form, setForm] = useState<TDeploymentPayload>(() => ({
    version: deployment?.version ?? "",
    environment: deployment?.environment ?? "production",
    status: deployment?.status ?? "pending",
    notes: deployment?.notes ?? "",
    scheduled_for: deployment?.scheduled_for ?? null,
  }));
  const [isSaving, setIsSaving] = useState(false);

  const set = <K extends keyof TDeploymentPayload>(key: K, value: TDeploymentPayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!projectId) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Pick a project", message: "A release belongs to a project." });
      return;
    }
    if (!form.version?.trim()) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Version required", message: "Name the release." });
      return;
    }
    setIsSaving(true);
    try {
      if (deployment) await operationsService.updateDeployment(workspaceSlug, projectId, deployment.id, form);
      else await operationsService.createDeployment(workspaceSlug, projectId, form);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Saved", message: "The deployment has been recorded." });
      onSaved();
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Not saved", message: "The deployment could not be saved." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalCore isOpen handleClose={onClose} width={EModalWidth.XXL}>
      <div className="flex flex-col gap-4 p-5">
        <h2 className="text-15 font-semibold text-primary">
          {deployment ? "Update deployment" : "Record a deployment"}
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            Project
            <select
              value={projectId}
              disabled={!!deployment}
              onChange={(event) => setProjectId(event.target.value)}
              className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary disabled:text-placeholder"
            >
              {joinedProjectIds.map((id) => (
                <option key={id} value={id}>
                  {getProjectById(id)?.name ?? "Project"}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            Version
            <input
              value={form.version ?? ""}
              onChange={(event) => set("version", event.target.value)}
              placeholder="v2.4.0"
              className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary placeholder:text-placeholder"
            />
          </label>

          <label className="flex flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            Environment
            <select
              value={form.environment}
              onChange={(event) => set("environment", event.target.value as TDeploymentEnvironment)}
              className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary"
            >
              {ENVIRONMENTS.map((environment) => (
                <option key={environment} value={environment}>
                  {DEPLOYMENT_ENVIRONMENT_LABEL[environment]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-11 font-medium tracking-wide text-tertiary uppercase">
            Status
            <select
              value={form.status}
              onChange={(event) => set("status", event.target.value as TDeploymentStatus)}
              className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13 text-primary"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {DEPLOYMENT_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <textarea
          rows={4}
          value={form.notes ?? ""}
          onChange={(event) => set("notes", event.target.value)}
          placeholder="What went out, anything that needed watching."
          className="w-full resize-y rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13 text-primary placeholder:text-placeholder"
        />

        <p className="text-11 text-placeholder">
          Start and finish times are recorded automatically when the status changes.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={submit} loading={isSaving}>
            Save
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});

export const DeploymentList = observer(function DeploymentList({ workspaceSlug }: { workspaceSlug: string }) {
  const { getProjectById } = useProject();
  const [environment, setEnvironment] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<TDeployment | null>(null);

  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug ? ["operations-deployments", workspaceSlug, environment] : null,
    () => operationsService.getDeployments(workspaceSlug, { environment }),
    { revalidateOnFocus: false }
  );

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Deployments"
        description="Every release, and what happened to it"
        action={
          <Button variant="primary" size="lg" prependIcon={<Plus />} onClick={() => setIsCreating(true)}>
            Record deployment
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEnvironment("")}
              className={cn(
                "rounded-full px-3 py-1 text-11 font-medium transition-colors",
                environment === ""
                  ? "bg-accent-primary text-on-color"
                  : "bg-layer-3 text-secondary hover:bg-layer-3-hover"
              )}
            >
              All environments
            </button>
            {ENVIRONMENTS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEnvironment(option)}
                className={cn(
                  "rounded-full px-3 py-1 text-11 font-medium transition-colors",
                  environment === option
                    ? "bg-accent-primary text-on-color"
                    : "bg-layer-3 text-secondary hover:bg-layer-3-hover"
                )}
              >
                {DEPLOYMENT_ENVIRONMENT_LABEL[option]}
              </button>
            ))}
          </div>

          {isLoading ? (
            <LoadingPanel />
          ) : error ? (
            <ErrorPanel />
          ) : (data?.results.length ?? 0) === 0 ? (
            <EmptyPanel label="No deployments recorded yet" />
          ) : (
            <ul className="flex flex-col gap-2">
              {data?.results.map((deployment) => (
                <li key={deployment.id} className="rounded-md border border-subtle p-3">
                  <button type="button" onClick={() => setEditing(deployment)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-13 font-medium text-primary">{deployment.version}</span>
                          <Pill>{getProjectById(deployment.project)?.name ?? "Project"}</Pill>
                          <Pill>{DEPLOYMENT_ENVIRONMENT_LABEL[deployment.environment]}</Pill>
                          <Pill className={DEPLOYMENT_STATUS_CLASS[deployment.status]}>
                            {DEPLOYMENT_STATUS_LABEL[deployment.status]}
                          </Pill>
                        </div>
                        {deployment.notes && <p className="mt-1.5 text-13 text-secondary">{deployment.notes}</p>}
                      </div>
                      <span className="shrink-0 text-right text-11 text-placeholder">
                        {formatDateTime(deployment.completed_at ?? deployment.started_at ?? deployment.created_at)}
                      </span>
                    </div>
                  </button>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {deployment.deployed_by && <OperationsMember memberId={deployment.deployed_by} />}
                    {deployment.issues.map((issue) => (
                      <Link
                        key={issue.id}
                        href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
                        className="max-w-full min-w-0 hover:underline"
                      >
                        <Pill className="max-w-full truncate">{issue.name}</Pill>
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      {isCreating && (
        <DeploymentModal
          workspaceSlug={workspaceSlug}
          onClose={() => setIsCreating(false)}
          onSaved={() => void mutate()}
        />
      )}
      {editing && (
        <DeploymentModal
          key={editing.id}
          workspaceSlug={workspaceSlug}
          deployment={editing}
          onClose={() => setEditing(null)}
          onSaved={() => void mutate()}
        />
      )}
    </div>
  );
});
