/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { testhubService } from "@plane/services";
import { Button } from "@plane/ui";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

const CATEGORIES = ["db_seed", "db_assert", "api_request", "api_assert"] as const;

function ActionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const [paramsText, setParamsText] = useState("{}");
  const [selected, setSelected] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  const words = catalog?.snapshot?.payload?.components?.action_words;
  const grouped = useMemo(() => {
    const list = words ?? [];
    const map: Record<string, typeof list> = {};
    for (const category of CATEGORIES) map[category] = [];
    for (const word of list) {
      const bucket = map[word.category] ?? (map[word.category] = []);
      bucket.push(word);
    }
    return map;
  }, [words]);
  const wordList = words ?? [];

  const current = wordList.find((word) => word.word_id === selected);
  const destructive = selected.startsWith("db_seed.") || selected.startsWith("api_request.");

  if (loading) return <p className="text-13 text-secondary">…</p>;
  if (!catalog?.repo) return <TesthubUnbound href={`${base}/bind`} />;

  const run = async () => {
    if (!workspaceSlug || !projectId || !selected) return;
    let params: Record<string, unknown> = {};
    try {
      params = JSON.parse(paramsText || "{}") as Record<string, unknown>;
    } catch {
      setMessage("invalid json");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const job = await testhubService.createJob(workspaceSlug, projectId, {
        kind: "action_words",
        params: { word_id: selected, params },
        confirmed,
      });
      navigate(`${base}/jobs/${job.id}`);
    } catch (err) {
      setMessage(typeof err === "object" && err && "error" in err ? String((err as { error: string }).error) : "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        {CATEGORIES.map((category) => (
          <section key={category}>
            <h2 className="mb-2 text-13 font-medium text-primary">{category}</h2>
            <ul className="space-y-1">
              {(grouped[category] ?? []).map((word) => (
                <li key={word.word_id}>
                  <button
                    type="button"
                    className={`w-full rounded-md px-3 py-2 text-left text-13 hover:bg-layer-1-hover ${
                      selected === word.word_id ? "bg-layer-1-selected" : "bg-layer-1"
                    }`}
                    onClick={() => {
                      setSelected(word.word_id);
                      setParamsText(JSON.stringify(word.example_params ?? {}, null, 2));
                      setConfirmed(false);
                    }}
                  >
                    <span className="text-primary">{word.name}</span>
                    <span className="ml-2 text-tertiary">{word.word_id}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="rounded-md bg-layer-1 p-4">
        {current ? (
          <div className="space-y-3">
            <p className="text-14 font-medium text-primary">{current.name}</p>
            <p className="text-12 text-secondary">{current.doc}</p>
            <label className="block text-13 text-secondary">{t("testhub.actions.params")}</label>
            <textarea
              className="h-48 w-full rounded-md border border-subtle bg-layer-2 p-2 text-12 text-primary"
              value={paramsText}
              onChange={(event) => setParamsText(event.target.value)}
            />
            {destructive ? (
              <label className="flex items-center gap-2 text-13 text-secondary">
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                {t("testhub.actions.confirm")}
              </label>
            ) : null}
            <Button
              variant="primary"
              size="sm"
              onClick={run}
              loading={busy}
              disabled={busy || (destructive && !confirmed)}
            >
              {t("testhub.actions.run")}
            </Button>
            {message ? <p className="text-13 text-secondary">{message}</p> : null}
          </div>
        ) : (
          <p className="text-13 text-secondary">{t("testhub.actions.pick")}</p>
        )}
      </div>
    </div>
  );
}

export default observer(ActionsPage);
