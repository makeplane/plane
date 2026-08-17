/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { gitsyncService, testhubService } from "@plane/services";
import type { TModuleCatalogPayload } from "@plane/types";
import { Checkbox, CustomSelect, Input } from "@plane/ui";
import { testhubErrorMessage } from "../helpers/error-message";
import { TesthubPageBody, TesthubPageLoader } from "../components/page-shell";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

function NewSessionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [environmentId, setEnvironmentId] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [featuresPayload, setFeaturesPayload] = useState<TModuleCatalogPayload | null>(null);
  const [envPayload, setEnvPayload] = useState<TModuleCatalogPayload | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;
  const preselect = searchParams.get("feature") || "";

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    gitsyncService
      .getModuleCatalog(workspaceSlug, projectId, "features")
      .then((data) => setFeaturesPayload(data.payload))
      .catch(() => setFeaturesPayload(null));
    gitsyncService
      .getModuleCatalog(workspaceSlug, projectId, "environments")
      .then((data) => setEnvPayload(data.payload))
      .catch(() => setEnvPayload(null));
  }, [workspaceSlug, projectId]);

  useEffect(() => {
    if (!preselect) return;
    setSelected((current) => ({ ...current, [`${preselect}::`]: true }));
  }, [preselect]);

  const features = featuresPayload?.features ?? [];
  const environments = envPayload?.environments ?? [];
  const featureSha = featuresPayload?.git?.sha || "";

  const selection = useMemo(() => {
    const items: Array<{ feature_path: string; scenario_name: string }> = [];
    for (const feature of featuresPayload?.features ?? []) {
      if (selected[`${feature.path}::`]) {
        items.push({ feature_path: feature.path, scenario_name: "" });
      }
      for (const scenario of feature.scenarios) {
        if (selected[`${feature.path}::${scenario.name}`]) {
          items.push({ feature_path: feature.path, scenario_name: scenario.name });
        }
      }
    }
    return items;
  }, [featuresPayload, selected]);

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.repo) return <TesthubUnbound href={configHref} />;

  const create = async () => {
    if (!workspaceSlug || !projectId) return;
    if (!selection.length) {
      setMessage(t("testhub.sessions.none_selected"));
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const session = await testhubService.createSession(workspaceSlug, projectId, {
        name: name || "Session",
        selection,
        feature_sha: featureSha,
        environment_id: environmentId,
        feature_source_module: "features",
      });
      navigate(`${base}/sessions/${session.id}`);
    } catch (err) {
      setMessage(testhubErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <TesthubPageBody>
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <h2 className="text-16 font-medium text-primary">{t("testhub.sessions.new")}</h2>
        <label className="block space-y-1">
          <span className="text-13 text-secondary">{t("testhub.sessions.name")}</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} className="w-full" />
        </label>
        <label className="block space-y-1">
          <span className="text-13 text-secondary">{t("testhub.sessions.environment")}</span>
          <CustomSelect
            value={environmentId}
            label={environments.find((env) => env.id === environmentId)?.name || t("testhub.sessions.environment")}
            onChange={(value: string) => setEnvironmentId(value)}
            input
          >
            <CustomSelect.Option value="">{t("testhub.sessions.environment")}</CustomSelect.Option>
            {environments.map((env) => (
              <CustomSelect.Option key={env.id} value={env.id}>
                {env.name}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        </label>
        <div className="space-y-2">
          <p className="text-13 text-secondary">{t("testhub.sessions.selection")}</p>
          {features.map((feature) => (
            <div key={feature.path} className="rounded-md border border-subtle p-3">
              <label className="flex items-center gap-2 text-13 text-primary">
                <Checkbox
                  checked={Boolean(selected[`${feature.path}::`])}
                  onChange={(event) =>
                    setSelected((current) => ({
                      ...current,
                      [`${feature.path}::`]: event.target.checked,
                    }))
                  }
                />
                {feature.name}
              </label>
              <ul className="mt-2 space-y-1 pl-6">
                {feature.scenarios.map((scenario) => (
                  <li key={scenario.name}>
                    <label className="flex items-center gap-2 text-13 text-secondary">
                      <Checkbox
                        checked={Boolean(selected[`${feature.path}::${scenario.name}`])}
                        onChange={(event) =>
                          setSelected((current) => ({
                            ...current,
                            [`${feature.path}::${scenario.name}`]: event.target.checked,
                          }))
                        }
                      />
                      {scenario.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {message ? <p className="text-13 text-danger-primary">{message}</p> : null}
        <Button variant="primary" size="lg" onClick={create} loading={busy} disabled={busy}>
          {t("testhub.sessions.create")}
        </Button>
      </div>
    </TesthubPageBody>
  );
}

export default observer(NewSessionPage);
