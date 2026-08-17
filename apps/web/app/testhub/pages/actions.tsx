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
import { Checkbox, TextArea } from "@plane/ui";
import { testhubErrorMessage } from "../helpers/error-message";
import { TesthubListRow } from "../components/list-row";
import { TesthubPageBody, TesthubPageLoader, TesthubSectionTitle } from "../components/page-shell";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

const CATEGORIES = ["db_seed", "db_assert", "api_request", "api_assert"] as const;

function ActionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const [paramsText, setParamsText] = useState("{}");
  const [selected, setSelected] = useState("");
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

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.repo) return <TesthubUnbound href={`/${workspaceSlug}/projects/${projectId}/gitsync`} />;

  const run = async () => {
    if (!workspaceSlug || !projectId || !selected) return;
    let params: Record<string, unknown> = {};
    try {
      params = JSON.parse(paramsText || "{}") as Record<string, unknown>;
    } catch {
      setMessage(t("testhub.actions.invalid_json"));
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
      setMessage(testhubErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <TesthubPageBody>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {CATEGORIES.map((category) => (
            <section key={category}>
              <TesthubSectionTitle>{category}</TesthubSectionTitle>
              <div className="overflow-hidden rounded-md border border-subtle">
                {(grouped[category] ?? []).map((word) => (
                  <TesthubListRow
                    key={word.word_id}
                    selected={selected === word.word_id}
                    onClick={() => {
                      setSelected(word.word_id);
                      setParamsText(JSON.stringify(word.example_params ?? {}, null, 2));
                      setConfirmed(false);
                    }}
                  >
                    <span>
                      <span className="text-primary">{word.name}</span>
                      <span className="ml-2 text-tertiary">{word.word_id}</span>
                    </span>
                  </TesthubListRow>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="rounded-md border border-subtle bg-layer-1 p-4">
          {current ? (
            <div className="space-y-3">
              <p className="text-14 font-medium text-primary">{current.name}</p>
              <p className="text-12 text-secondary">{current.doc}</p>
              <label className="block space-y-1">
                <span className="text-13 text-secondary">{t("testhub.actions.params")}</span>
                <TextArea
                  className="h-48 w-full"
                  value={paramsText}
                  onChange={(event) => setParamsText(event.target.value)}
                />
              </label>
              {destructive ? (
                <label className="flex items-center gap-2 text-13 text-secondary">
                  <Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
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
              {message ? <p className="text-13 text-danger-primary">{message}</p> : null}
            </div>
          ) : (
            <p className="text-13 text-secondary">{t("testhub.actions.pick")}</p>
          )}
        </div>
      </div>
    </TesthubPageBody>
  );
}

export default observer(ActionsPage);
