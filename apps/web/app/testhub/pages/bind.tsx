/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Link, useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { gitsyncService, testhubService } from "@plane/services";
import type { TProjectGitRemote } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { testhubErrorMessage } from "../helpers/error-message";
import { TesthubPageBody } from "../components/page-shell";
import type { TTesthubOutletContext } from "../layout";

function BindPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, reload } = useOutletContext<TTesthubOutletContext>();
  const [remotes, setRemotes] = useState<TProjectGitRemote[]>([]);
  const [remoteId, setRemoteId] = useState(catalog?.repo?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (catalog?.repo?.id) setRemoteId(catalog.repo.id);
  }, [catalog?.repo?.id]);

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    gitsyncService
      .listRemotes(workspaceSlug, projectId)
      .then((data) => setRemotes(data.remotes))
      .catch((err) => setError(testhubErrorMessage(err)));
  }, [workspaceSlug, projectId]);

  const save = async () => {
    if (!workspaceSlug || !projectId || !remoteId) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await testhubService.bindRepo(workspaceSlug, projectId, { remote_id: remoteId });
      await reload();
      setMessage(t("testhub.bind.saved"));
    } catch (err) {
      setError(testhubErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const selected = remotes.find((remote) => remote.id === remoteId);
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;

  return (
    <TesthubPageBody>
      <div className="mx-auto w-full max-w-xl space-y-4 py-5">
        <h2 className="text-16 font-medium text-primary">{t("testhub.bind.title")}</h2>
        <p className="text-13 text-secondary">{t("testhub.bind.select_help")}</p>
        {remotes.length === 0 ? (
          <p className="text-13 text-secondary">
            {t("testhub.bind.no_sources")}{" "}
            <Link to={configHref} className="text-accent-primary">
              {t("testhub.bind.go_to_config")}
            </Link>
          </p>
        ) : (
          <label className="block space-y-1">
            <span className="text-13 text-secondary">{t("testhub.bind.select_source")}</span>
            <CustomSelect
              value={remoteId}
              label={selected?.name || t("testhub.bind.select_source")}
              onChange={(value: string) => setRemoteId(value)}
              input
            >
              {remotes.map((remote) => (
                <CustomSelect.Option key={remote.id} value={remote.id}>
                  {remote.name} · {remote.kind}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </label>
        )}
        <div className="flex items-center gap-3">
          <Button variant="primary" size="lg" onClick={save} loading={saving} disabled={saving || !remoteId}>
            {t("testhub.bind.save")}
          </Button>
          <Link to={configHref} className="text-13 text-accent-primary">
            {t("testhub.bind.go_to_config")}
          </Link>
        </div>
        {message ? <p className="text-13 text-secondary">{message}</p> : null}
        {error ? <p className="text-13 text-danger-primary">{error}</p> : null}
      </div>
    </TesthubPageBody>
  );
}

export default observer(BindPage);
