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
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { testhubService } from "@plane/services";
import { Checkbox, EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { testhubErrorMessage } from "@/app/testhub/helpers/error-message";
import { TesthubListRow } from "@/app/testhub/components/list-row";
import { TesthubPageBody, TesthubSectionTitle } from "@/app/testhub/components/page-shell";
import { FormulationRegisteredAssets } from "../components/registered-assets";
import type { TFormulationOutletContext } from "../layout";

const KNOWN_CATEGORIES = ["db_seed", "db_assert", "api_request", "api_assert", "ui_action", "ui_assert"] as const;

type TActionWord = {
  word_id: string;
  name: string;
  category: string;
  plane_kind?: string;
  destructive?: boolean;
  params_schema?: Record<string, unknown>;
  example_params?: Record<string, unknown>;
  doc?: string;
};

function ActionWordSchemaButton({ name, schema }: { name: string; schema: Record<string, unknown> }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const text = useMemo(() => JSON.stringify(schema, null, 2), [schema]);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {t("testhub.actions.schema")}
      </Button>
      <ModalCore
        isOpen={open}
        handleClose={() => setOpen(false)}
        position={EModalPosition.CENTER}
        width={EModalWidth.XXXXL}
      >
        <div className="flex max-h-[80vh] flex-col gap-3 p-5 text-left">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-13 font-medium text-primary">{name}</p>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              {t("testhub.file.close")}
            </Button>
          </div>
          <pre className="min-h-40 flex-1 overflow-auto rounded-md bg-layer-1 p-3 text-12 whitespace-pre-wrap text-secondary">
            {text}
          </pre>
        </div>
      </ModalCore>
    </>
  );
}

function ActionWordsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceSlug, projectId } = useParams();
  const ctx = useOutletContext<TFormulationOutletContext>();
  const [wordQuery, setWordQuery] = useState("");
  const [paramsText, setParamsText] = useState("{}");
  const [selected, setSelected] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const jobsBase = `/${workspaceSlug}/projects/${projectId}/jobs`;
  const words = useMemo(() => ctx.testhub?.snapshot?.payload?.components?.action_words ?? [], [ctx.testhub]);
  const canRun = Boolean(ctx.testhub?.repo);

  const filteredWords = useMemo(() => {
    const q = wordQuery.trim().toLowerCase();
    if (!q) return words;
    return words.filter((word) => `${word.word_id} ${word.name} ${word.category}`.toLowerCase().includes(q));
  }, [wordQuery, words]);

  const grouped = useMemo(() => {
    const order: string[] = [...KNOWN_CATEGORIES];
    const map: Record<string, TActionWord[]> = {};
    for (const category of order) map[category] = [];
    for (const word of filteredWords) {
      if (!order.includes(word.category)) order.push(word.category);
      const bucket = map[word.category] ?? (map[word.category] = []);
      bucket.push(word);
    }
    return { order, map };
  }, [filteredWords]);

  const current = words.find((word) => word.word_id === selected);
  const destructive =
    current?.destructive ??
    Boolean(
      selected.startsWith("db_seed.") || selected.startsWith("api_request.") || selected.startsWith("ui_action.")
    );

  const run = async () => {
    if (!workspaceSlug || !projectId || !selected || !canRun) return;
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
        kind: current?.plane_kind || current?.category || selected.split(".", 1)[0] || "db_seed",
        params: { word_id: selected, params },
        confirmed,
      });
      navigate(`${jobsBase}/${job.id}`);
    } catch (err) {
      setMessage(testhubErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormulationRegisteredAssets {...ctx}>
      <TesthubPageBody>
        <Input
          value={wordQuery}
          onChange={(event) => setWordQuery(event.target.value)}
          className="mb-3 w-full max-w-md"
          placeholder={t("formulation.filter_words")}
        />
        {!canRun ? <p className="mb-3 text-13 text-secondary">{t("formulation.run_unbound")}</p> : null}
        {filteredWords.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              {grouped.order.map((category) =>
                grouped.map[category]?.length ? (
                  <section key={category}>
                    <TesthubSectionTitle>{category}</TesthubSectionTitle>
                    <div className="overflow-hidden rounded-md border border-subtle">
                      {grouped.map[category].map((word) => (
                        <TesthubListRow
                          key={word.word_id}
                          selected={selected === word.word_id}
                          onClick={() => {
                            setSelected(word.word_id);
                            setParamsText(JSON.stringify(word.example_params ?? {}, null, 2));
                            setConfirmed(false);
                            setMessage("");
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
                ) : null
              )}
            </div>
            <div className="rounded-md border border-subtle bg-layer-1 p-4">
              {current ? (
                <div className="space-y-3">
                  <p className="text-14 font-medium text-primary">{current.name}</p>
                  {current.doc ? <p className="text-12 text-secondary">{current.doc}</p> : null}
                  <ActionWordSchemaButton
                    key={current.word_id}
                    name={current.name}
                    schema={current.params_schema ?? {}}
                  />
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
                    disabled={busy || !canRun || (destructive && !confirmed)}
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
        ) : (
          <EmptyStateCompact assetKey="search" title={t("formulation.empty")} />
        )}
      </TesthubPageBody>
    </FormulationRegisteredAssets>
  );
}

export default observer(ActionWordsPage);
