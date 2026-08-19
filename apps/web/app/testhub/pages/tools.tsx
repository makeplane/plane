/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { testhubService } from "@plane/services";
import { Checkbox, Input, TextArea } from "@plane/ui";
import { testhubErrorMessage } from "../helpers/error-message";
import { TesthubPageBody, TesthubPageLoader } from "../components/page-shell";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";
import type { TTesthubTool } from "@plane/types";

function isRunnable(tool: TTesthubTool): boolean {
  if (tool.app_id === "index_platform") return false;
  if (typeof tool.plane_runnable === "boolean") return tool.plane_runnable;
  return Boolean(tool.whitelisted);
}

function parseFieldValue(spec: Record<string, unknown> | undefined, raw: unknown): unknown {
  const type = spec?.type;
  if (type === "boolean") return Boolean(raw);
  if (type === "object") {
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw || "{}") as unknown;
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("object");
      }
      return parsed;
    }
    return raw && typeof raw === "object" ? raw : {};
  }
  if (type === "array") {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return raw.split(/[\s,]+/).filter(Boolean);
    return [];
  }
  return raw ?? "";
}

function ToolFields({
  tool,
  values,
  onChange,
}: {
  tool: TTesthubTool;
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const { t } = useTranslation();
  const properties = (tool.params_schema?.properties ?? {}) as Record<string, Record<string, unknown>>;
  const keys = Object.keys(properties);
  if (!keys.length) return null;

  return (
    <div className="mt-3 grid gap-2">
      {keys.map((key) => {
        const spec = properties[key] ?? {};
        const type = spec.type;
        const enumValues = Array.isArray(spec.enum) ? spec.enum.map(String) : null;
        if (type === "boolean") {
          return (
            <label key={key} className="flex items-center gap-2 text-13 text-secondary">
              <Checkbox
                checked={Boolean(values[key])}
                onChange={(event) => onChange({ ...values, [key]: event.target.checked })}
              />
              {key === "example" ? t("testhub.tools.example") : key}
            </label>
          );
        }
        if (type === "object" || key === "params") {
          const text =
            typeof values[key] === "string" ? String(values[key]) : JSON.stringify(values[key] ?? {}, null, 2);
          return (
            <label key={key} className="space-y-1">
              <span className="text-12 text-secondary">{t("testhub.actions.params")}</span>
              <TextArea
                className="h-32 w-full"
                value={text}
                onChange={(event) => onChange({ ...values, [key]: event.target.value })}
              />
            </label>
          );
        }
        if (enumValues) {
          return (
            <label key={key} className="space-y-1">
              <span className="text-12 text-secondary">{key}</span>
              <select
                className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary"
                value={String(values[key] ?? enumValues[0] ?? "")}
                onChange={(event) => onChange({ ...values, [key]: event.target.value })}
              >
                {enumValues.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        return (
          <label key={key} className="space-y-1">
            <span className="text-12 text-secondary">{key}</span>
            <Input
              value={String(values[key] ?? "")}
              onChange={(event) => onChange({ ...values, [key]: event.target.value })}
            />
          </label>
        );
      })}
    </div>
  );
}

function ToolsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const [formById, setFormById] = useState<Record<string, Record<string, unknown>>>({});
  const [confirmedById, setConfirmedById] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const jobsBase = `/${workspaceSlug}/projects/${projectId}/jobs`;

  const tools = useMemo(
    () => (catalog?.snapshot?.payload?.tools ?? []).filter((tool) => tool.app_id !== "index_platform"),
    [catalog]
  );

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.repo) return <TesthubUnbound href={`/${workspaceSlug}/projects/${projectId}/gitsync`} />;

  const run = async (tool: TTesthubTool) => {
    if (!workspaceSlug || !projectId) return;
    const properties = (tool.params_schema?.properties ?? {}) as Record<string, Record<string, unknown>>;
    const raw = formById[tool.app_id] ?? {};
    const params: Record<string, unknown> = {};
    try {
      for (const [key, spec] of Object.entries(properties)) {
        if (raw[key] === undefined || raw[key] === "") continue;
        params[key] = parseFieldValue(spec, raw[key]);
      }
    } catch {
      setMessage(t("testhub.actions.invalid_json"));
      return;
    }
    setBusy(tool.app_id);
    setMessage("");
    try {
      const job = await testhubService.createJob(workspaceSlug, projectId, {
        kind: tool.app_id,
        params,
        confirmed: Boolean(confirmedById[tool.app_id]),
      });
      navigate(`${jobsBase}/${job.id}`);
    } catch (err) {
      setMessage(testhubErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <TesthubPageBody>
      <div className="space-y-3">
        {tools.length ? (
          tools.map((tool) => {
            const runnable = isRunnable(tool);
            return (
              <div key={tool.app_id} className="rounded-md border border-subtle bg-layer-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-14 font-medium text-primary">{tool.name}</p>
                    <p className="text-12 text-tertiary">{tool.app_id}</p>
                    <p className="text-12 text-secondary">{(tool.argv ?? []).join(" ")}</p>
                  </div>
                  {runnable ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={Boolean(busy) || (tool.destructive && !confirmedById[tool.app_id])}
                      loading={busy === tool.app_id}
                      onClick={() => void run(tool)}
                    >
                      {t("testhub.tools.run")}
                    </Button>
                  ) : (
                    <span className="text-12 text-tertiary">{t("testhub.tools.not_whitelisted")}</span>
                  )}
                </div>
                {runnable ? (
                  <ToolFields
                    tool={tool}
                    values={formById[tool.app_id] ?? {}}
                    onChange={(next) => setFormById((current) => ({ ...current, [tool.app_id]: next }))}
                  />
                ) : null}
                {runnable && tool.destructive ? (
                  <label className="mt-3 flex items-center gap-2 text-13 text-secondary">
                    <Checkbox
                      checked={Boolean(confirmedById[tool.app_id])}
                      onChange={(event) =>
                        setConfirmedById((current) => ({ ...current, [tool.app_id]: event.target.checked }))
                      }
                    />
                    {t("testhub.actions.confirm")}
                  </label>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="text-13 text-secondary">{t("testhub.tools.empty")}</p>
        )}
        {message ? <p className="text-13 text-danger-primary">{message}</p> : null}
      </div>
    </TesthubPageBody>
  );
}

export default observer(ToolsPage);
