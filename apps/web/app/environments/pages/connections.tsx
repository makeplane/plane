/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useOutletContext, useParams } from "react-router";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { gitsyncService, testhubService } from "@plane/services";
import { FilePreviewButton } from "@/app/testhub/components/file-preview";
import { testhubErrorMessage } from "@/app/testhub/helpers/error-message";
import { TesthubPageBody, TesthubPageLoader, TesthubSectionTitle } from "@/app/testhub/components/page-shell";
import { TesthubUnbound } from "@/app/testhub/components/unbound";
import { useUserPermissions } from "@/hooks/store/user";
import type { TEnvironmentsOutletContext } from "../layout";

async function waitForJob(workspaceSlug: string, projectId: string, jobId: string, attempt = 0) {
  const job = await testhubService.getJob(workspaceSlug, projectId, jobId);
  if (job.status === "succeeded" || job.status === "failed") return job;
  if (attempt >= 39) throw new Error("timeout");
  await new Promise((resolve) => setTimeout(resolve, 500));
  return waitForJob(workspaceSlug, projectId, jobId, attempt + 1);
}

function ConnectionsPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { allowPermissions } = useUserPermissions();
  const { catalog, loading, reload } = useOutletContext<TEnvironmentsOutletContext>();
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);
  const [activating, setActivating] = useState<string | null>(null);
  const [envLocal, setEnvLocal] = useState("");
  const [envLocalMeta, setEnvLocalMeta] = useState<{ exists: boolean; example: boolean } | null>(null);
  const [envLocalBusy, setEnvLocalBusy] = useState(false);

  useEffect(() => {
    if (!workspaceSlug || !projectId || !isAdmin || !catalog?.remote) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await gitsyncService.getEnvLocal(workspaceSlug, projectId);
        if (cancelled) return;
        setEnvLocal(data.content);
        setEnvLocalMeta({ exists: data.exists, example: data.example });
      } catch (err) {
        if (cancelled) return;
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("environments.env_local_title"),
          message: testhubErrorMessage(err) || t("environments.env_local_load_error"),
        });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, projectId, isAdmin, catalog?.remote, t]);

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.remote) {
    return (
      <TesthubUnbound
        href={configHref}
        title={t("environments.unbound")}
        description={t("environments.unbound_description")}
        cta={t("environments.cta")}
      />
    );
  }

  const environments = catalog.payload?.environments ?? [];
  const activeEnv = catalog.payload?.active_env || environments.find((env) => env.active)?.id || "";

  const activate = async (name: string) => {
    if (!workspaceSlug || !projectId) return;
    setActivating(name);
    try {
      const response = await gitsyncService.activateEnvironment(workspaceSlug, projectId, name);
      const job = await waitForJob(workspaceSlug, projectId, response.job.id);
      if (job.status !== "succeeded") {
        throw new Error(job.stderr || t("environments.activate_failed"));
      }
      await reload();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("environments.activate"),
        message: t("environments.activated"),
      });
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("environments.activate"),
        message: testhubErrorMessage(err),
      });
    } finally {
      setActivating(null);
    }
  };

  const saveEnvLocal = async () => {
    if (!workspaceSlug || !projectId) return;
    setEnvLocalBusy(true);
    try {
      await gitsyncService.putEnvLocal(workspaceSlug, projectId, envLocal);
      await reload();
      setEnvLocalMeta({ exists: true, example: false });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("environments.env_local_title"),
        message: t("environments.env_local_saved"),
      });
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("environments.env_local_title"),
        message: testhubErrorMessage(err),
      });
    } finally {
      setEnvLocalBusy(false);
    }
  };

  return (
    <TesthubPageBody>
      <p className="mb-4 text-13 text-secondary">{t("environments.named_hint")}</p>
      <p className="mb-4 text-13 text-tertiary">{t("environments.redacted_hint")}</p>
      <div className="space-y-4">
        {environments.map((env) => {
          const isActive = Boolean(env.active) || env.id === activeEnv;
          const canActivate = env.mode === "named" && !isActive;
          const previewPath = env.source_files?.find((file) => !file.path.includes("local"))?.path || env.source;
          return (
            <section key={env.id} className="space-y-3 rounded-md border border-subtle p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-14 font-medium text-primary">{env.name}</h2>
                  {isActive ? (
                    <span className="rounded-sm bg-layer-2 px-1.5 py-0.5 text-11 text-secondary">
                      {t("environments.active")}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {canActivate ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => activate(env.id)}
                      loading={activating === env.id}
                      disabled={Boolean(activating)}
                    >
                      {activating === env.id ? t("environments.activating") : t("environments.activate")}
                    </Button>
                  ) : null}
                  {previewPath ? <FilePreviewButton path={previewPath} moduleKey="environments" /> : null}
                </div>
              </div>
              <TesthubSectionTitle>{t("environments.targets")}</TesthubSectionTitle>
              <ul className="space-y-1 text-13 text-secondary">
                {env.targets.map((target) => (
                  <li key={target.id}>
                    {target.kind} · {target.base_url}
                  </li>
                ))}
                {!env.targets.length ? <li className="text-tertiary">{t("environments.empty")}</li> : null}
              </ul>
              <TesthubSectionTitle>{t("environments.datasources")}</TesthubSectionTitle>
              <ul className="space-y-1 text-13 text-secondary">
                {env.datasources.map((ds) => (
                  <li key={ds.alias}>
                    {ds.alias} · {ds.engine || "—"} · {ds.host || "—"} · {ds.database || "—"}
                  </li>
                ))}
                {!env.datasources.length ? <li className="text-tertiary">{t("environments.empty")}</li> : null}
              </ul>
              <TesthubSectionTitle>{t("environments.secret_keys")}</TesthubSectionTitle>
              <p className="text-13 text-tertiary">{env.secret_keys.join(", ") || "—"}</p>
              <TesthubSectionTitle>{t("environments.variables")}</TesthubSectionTitle>
              <ul className="space-y-1 text-13 text-secondary">
                {env.variables.map((item) => (
                  <li key={item.key}>
                    {item.key} = {item.value}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {!environments.length ? <p className="text-13 text-tertiary">{t("environments.empty")}</p> : null}
      </div>
      {isAdmin ? (
        <section className="mt-6 space-y-3 rounded-md border border-subtle p-3">
          <TesthubSectionTitle>{t("environments.env_local_title")}</TesthubSectionTitle>
          <p className="text-13 text-tertiary">{t("environments.env_local_hint")}</p>
          {envLocalMeta?.example ? (
            <p className="text-13 text-secondary">{t("environments.env_local_example")}</p>
          ) : null}
          <textarea
            aria-label={t("environments.env_local_title")}
            value={envLocal}
            onChange={(event) => setEnvLocal(event.target.value)}
            spellCheck={false}
            className="font-mono h-80 w-full rounded-md border-[0.5px] border-subtle-1 bg-layer-2 p-3 text-12 text-primary outline-none"
          />
          <Button variant="primary" size="sm" onClick={saveEnvLocal} loading={envLocalBusy} disabled={envLocalBusy}>
            {envLocalBusy ? t("environments.env_local_saving") : t("environments.env_local_save")}
          </Button>
        </section>
      ) : null}
    </TesthubPageBody>
  );
}

export default observer(ConnectionsPage);
