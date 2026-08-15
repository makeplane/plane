/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { testhubService } from "@plane/services";
import { Button, Input } from "@plane/ui";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

function ToolsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const [tables, setTables] = useState("");
  const [datasource, setDatasource] = useState("main");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  if (loading) return <p className="text-13 text-secondary">…</p>;
  if (!catalog?.repo) return <TesthubUnbound href={`${base}/bind`} />;

  const tools = catalog.snapshot?.payload?.tools ?? [];

  const run = async (kind: string, params: Record<string, unknown> = {}) => {
    if (!workspaceSlug || !projectId) return;
    setBusy(kind);
    setMessage("");
    try {
      const job = await testhubService.createJob(workspaceSlug, projectId, { kind, params });
      navigate(`${base}/jobs/${job.id}`);
    } catch (err) {
      setMessage(typeof err === "object" && err && "error" in err ? String((err as { error: string }).error) : "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      {tools.map((tool) => (
        <div key={tool.app_id} className="rounded-md bg-layer-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-14 font-medium text-primary">{tool.name}</p>
              <p className="text-12 text-tertiary">{tool.app_id}</p>
              <p className="text-12 text-secondary">{tool.argv.join(" ")}</p>
            </div>
            {tool.whitelisted && tool.app_id !== "action_words" ? (
              <Button
                variant="primary"
                size="sm"
                disabled={Boolean(busy)}
                loading={busy === tool.app_id}
                onClick={() => {
                  if (tool.app_id === "dump_ddl") {
                    const list = tables.split(/[\s,]+/).filter(Boolean);
                    if (!list.length) {
                      setMessage("dump_ddl requires at least one table");
                      return;
                    }
                    void run("dump_ddl", { tables: list, datasource });
                    return;
                  }
                  void run(tool.app_id);
                }}
              >
                {t("testhub.tools.run")}
              </Button>
            ) : (
              <span className="text-12 text-tertiary">{t("testhub.tools.not_whitelisted")}</span>
            )}
          </div>
          {tool.app_id === "dump_ddl" ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-12 text-secondary">{t("testhub.tools.tables")}</span>
                <Input
                  value={tables}
                  onChange={(event) => setTables(event.target.value)}
                  placeholder="invoice invoice_verify_basic"
                />
              </label>
              <label className="space-y-1">
                <span className="text-12 text-secondary">{t("testhub.tools.datasource")}</span>
                <select
                  className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary"
                  value={datasource}
                  onChange={(event) => setDatasource(event.target.value)}
                >
                  <option value="main">main</option>
                  <option value="cdcs">cdcs</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>
      ))}
      {message ? <p className="text-13 text-secondary">{message}</p> : null}
    </div>
  );
}

export default observer(ToolsPage);
