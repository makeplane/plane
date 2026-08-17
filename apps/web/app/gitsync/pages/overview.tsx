/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { CircleHelp } from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { gitsyncService } from "@plane/services";
import type { TGitRemoteKind, TGitSyncModuleKey, TModuleBindingRow, TProjectGitRemote } from "@plane/types";
import { CustomSelect, Input, Tooltip } from "@plane/ui";
import { pollJobUntilSettled } from "@/app/testhub/helpers/poll-job";
import { gitsyncErrorMessage } from "../helpers/error-message";

const MODULE_LABEL: Record<
  TGitSyncModuleKey,
  "gitsync.modules.testhub" | "gitsync.modules.features" | "gitsync.modules.wiki" | "gitsync.modules.prd"
> = {
  testhub: "gitsync.modules.testhub",
  features: "gitsync.modules.features",
  wiki: "gitsync.modules.wiki",
  prd: "gitsync.modules.prd",
};

const MODULE_CONVENTION: Record<
  TGitSyncModuleKey,
  | "gitsync.conventions.testhub"
  | "gitsync.conventions.features"
  | "gitsync.conventions.wiki"
  | "gitsync.conventions.prd"
> = {
  testhub: "gitsync.conventions.testhub",
  features: "gitsync.conventions.features",
  wiki: "gitsync.conventions.wiki",
  prd: "gitsync.conventions.prd",
};

const UNBOUND = "none";

function PageBody({ children }: { children: React.ReactNode }) {
  return <div className="vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto px-page-x py-4">{children}</div>;
}

function OverviewPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const [remotes, setRemotes] = useState<TProjectGitRemote[]>([]);
  const [bindings, setBindings] = useState<TModuleBindingRow[]>([]);
  const [defaultWorkdir, setDefaultWorkdir] = useState("/opt/testhub/workdir");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const [name, setName] = useState("Local test repo");
  const [kind, setKind] = useState<TGitRemoteKind>("local_mount");
  const [workdir, setWorkdir] = useState("/opt/testhub/workdir");
  const [hostPath, setHostPath] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [credentialRef, setCredentialRef] = useState("");

  const [bindingDraft, setBindingDraft] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    if (!workspaceSlug || !projectId) return;
    const [remoteList, bindingList] = await Promise.all([
      gitsyncService.listRemotes(workspaceSlug, projectId),
      gitsyncService.listBindings(workspaceSlug, projectId),
    ]);
    setRemotes(remoteList.remotes);
    setDefaultWorkdir(remoteList.defaults.local_mount_workdir || "/opt/testhub/workdir");
    setBindings(bindingList.bindings);
    const draft: Record<string, string> = {};
    for (const row of bindingList.bindings) {
      draft[row.module_key] = row.binding?.remote.id ?? UNBOUND;
    }
    setBindingDraft(draft);
  }, [workspaceSlug, projectId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload()
      .catch((err) => {
        if (!cancelled) setError(gitsyncErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const addRemote = async () => {
    if (!workspaceSlug || !projectId) return;
    setError("");
    setMessage("");
    setBusyId("create");
    try {
      await gitsyncService.createRemote(workspaceSlug, projectId, {
        name,
        kind,
        workdir: kind === "local_mount" ? workdir || defaultWorkdir : undefined,
        host_path: hostPath,
        repo_url: kind === "git_url" ? repoUrl : "",
        branch: kind === "git_url" ? branch : "",
        credential_ref: kind === "git_url" ? credentialRef : "",
      });
      await reload();
      setMessage(t("gitsync.remotes.saved"));
    } catch (err) {
      setError(gitsyncErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const syncRemote = async (remote: TProjectGitRemote) => {
    if (!workspaceSlug || !projectId) return;
    setError("");
    setMessage("");
    setBusyId(remote.id);
    try {
      const result = await gitsyncService.syncRemote(workspaceSlug, projectId, remote.id);
      const testhubJob = result.testhub_job;
      if (result.error) {
        setError(result.error);
      } else if (testhubJob && "error" in testhubJob && testhubJob.error) {
        setError(testhubJob.error);
      } else if (testhubJob && "id" in testhubJob && testhubJob.id) {
        await pollJobUntilSettled(workspaceSlug, projectId, testhubJob.id);
        setMessage(t("gitsync.remotes.synced"));
      } else {
        setMessage(t("gitsync.remotes.synced"));
      }
      await reload();
    } catch (err) {
      setError(gitsyncErrorMessage(err));
      await reload();
    } finally {
      setBusyId("");
    }
  };

  const removeRemote = async (remote: TProjectGitRemote) => {
    if (!workspaceSlug || !projectId) return;
    setError("");
    setMessage("");
    setBusyId(remote.id);
    try {
      await gitsyncService.deleteRemote(workspaceSlug, projectId, remote.id);
      await reload();
    } catch (err) {
      setError(gitsyncErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const saveBindings = async () => {
    if (!workspaceSlug || !projectId) return;
    setError("");
    setMessage("");
    setBusyId("bindings");
    try {
      await gitsyncService.saveBindings(
        workspaceSlug,
        projectId,
        bindings.map((row) => ({
          module_key: row.module_key,
          remote_id:
            bindingDraft[row.module_key] && bindingDraft[row.module_key] !== UNBOUND
              ? bindingDraft[row.module_key]
              : null,
        }))
      );
      await reload();
      setMessage(t("gitsync.modules.saved"));
    } catch (err) {
      setError(gitsyncErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  return (
    <PageBody>
      <div className="mx-auto w-full max-w-3xl space-y-8 py-2">
        {error ? <p className="text-13 text-danger-primary">{error}</p> : null}
        {message ? <p className="text-13 text-secondary">{message}</p> : null}

        <section className="space-y-3">
          <div>
            <h2 className="text-16 font-medium text-primary">{t("gitsync.remotes.title")}</h2>
            <p className="text-13 text-secondary">{t("gitsync.remotes.local_mount_hint")}</p>
          </div>
          {loading ? <p className="text-13 text-tertiary">{t("gitsync.remotes.loading")}</p> : null}
          {!loading && remotes.length === 0 ? (
            <p className="text-13 text-tertiary">{t("gitsync.remotes.empty_description")}</p>
          ) : null}
          <div className="space-y-2">
            {remotes.map((remote) => (
              <div key={remote.id} className="space-y-1 rounded-md bg-layer-1 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-14 font-medium text-primary">{remote.name}</p>
                    <p className="text-12 text-tertiary">
                      {t(remote.kind === "git_url" ? "gitsync.kinds.git_url" : "gitsync.kinds.local_mount")} ·{" "}
                      {remote.workdir}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => syncRemote(remote)}
                      loading={busyId === remote.id}
                      disabled={busyId !== "" || remote.kind === "git_url"}
                    >
                      {t("gitsync.remotes.sync")}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => removeRemote(remote)} disabled={busyId !== ""}>
                      {t("gitsync.remotes.delete")}
                    </Button>
                  </div>
                </div>
                <p className="text-12 text-secondary">
                  {t("gitsync.remotes.sha")}: {remote.last_sync_sha || "—"} · {t("gitsync.remotes.status")}:{" "}
                  {remote.last_sync_status || "—"}
                </p>
                {remote.kind === "git_url" ? (
                  <p className="text-12 text-tertiary">{t("gitsync.git_url.sync_disabled")}</p>
                ) : null}
                {remote.last_sync_error ? (
                  <p className="text-12 text-danger-primary">{remote.last_sync_error}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-md border border-subtle p-3">
            <h3 className="text-14 font-medium text-primary">{t("gitsync.remotes.add")}</h3>
            <label className="block space-y-1">
              <span className="text-13 text-secondary">{t("gitsync.remotes.name")}</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} className="w-full" />
            </label>
            <label className="block space-y-1">
              <span className="text-13 text-secondary">{t("gitsync.remotes.kind")}</span>
              <CustomSelect
                value={kind}
                label={t(kind === "git_url" ? "gitsync.kinds.git_url" : "gitsync.kinds.local_mount")}
                onChange={(value: TGitRemoteKind) => setKind(value)}
                input
              >
                <CustomSelect.Option value="local_mount">{t("gitsync.kinds.local_mount")}</CustomSelect.Option>
                <CustomSelect.Option value="git_url">{t("gitsync.kinds.git_url")}</CustomSelect.Option>
              </CustomSelect>
            </label>
            {kind === "local_mount" ? (
              <>
                <label className="block space-y-1">
                  <span className="text-13 text-secondary">{t("gitsync.remotes.workdir")}</span>
                  <Input value={workdir} onChange={(event) => setWorkdir(event.target.value)} className="w-full" />
                </label>
                <label className="block space-y-1">
                  <span className="text-13 text-secondary">{t("gitsync.remotes.host_path")}</span>
                  <Input value={hostPath} onChange={(event) => setHostPath(event.target.value)} className="w-full" />
                </label>
              </>
            ) : (
              <>
                <p className="text-13 text-secondary">{t("gitsync.git_url.coming_soon")}</p>
                <label className="block space-y-1">
                  <span className="text-13 text-secondary">{t("gitsync.remotes.repo_url")}</span>
                  <Input value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} className="w-full" />
                </label>
                <label className="block space-y-1">
                  <span className="text-13 text-secondary">{t("gitsync.remotes.branch")}</span>
                  <Input value={branch} onChange={(event) => setBranch(event.target.value)} className="w-full" />
                </label>
                <label className="block space-y-1">
                  <span className="text-13 text-secondary">{t("gitsync.remotes.credential_ref")}</span>
                  <Input
                    value={credentialRef}
                    onChange={(event) => setCredentialRef(event.target.value)}
                    className="w-full"
                  />
                </label>
              </>
            )}
            <Button
              variant="primary"
              size="lg"
              onClick={addRemote}
              loading={busyId === "create"}
              disabled={busyId !== ""}
            >
              {t("gitsync.remotes.save")}
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-16 font-medium text-primary">{t("gitsync.modules.title")}</h2>
            <p className="text-13 text-secondary">{t("gitsync.modules.help")}</p>
          </div>
          {bindings.map((row) => (
            <div key={row.module_key} className="flex flex-wrap items-center gap-3 rounded-md bg-layer-1 p-3">
              <div className="flex min-w-40 items-center gap-1">
                <span className="text-13 font-medium text-primary">{t(MODULE_LABEL[row.module_key])}</span>
                <Tooltip tooltipContent={t(MODULE_CONVENTION[row.module_key])} position="top">
                  <button type="button" className="text-tertiary" aria-label={t("gitsync.modules.convention")}>
                    <CircleHelp className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>
              </div>
              <CustomSelect
                value={bindingDraft[row.module_key] || UNBOUND}
                label={
                  remotes.find((remote) => remote.id === bindingDraft[row.module_key])?.name ||
                  t("gitsync.modules.unbound")
                }
                onChange={(value: string) => setBindingDraft((current) => ({ ...current, [row.module_key]: value }))}
                input
              >
                <CustomSelect.Option value={UNBOUND}>{t("gitsync.modules.unbound")}</CustomSelect.Option>
                {remotes.map((remote) => (
                  <CustomSelect.Option key={remote.id} value={remote.id}>
                    {remote.name}
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
          ))}
          <Button
            variant="primary"
            size="lg"
            onClick={saveBindings}
            loading={busyId === "bindings"}
            disabled={busyId !== ""}
          >
            {t("gitsync.modules.save")}
          </Button>
        </section>
      </div>
    </PageBody>
  );
}

export default observer(OverviewPage);
