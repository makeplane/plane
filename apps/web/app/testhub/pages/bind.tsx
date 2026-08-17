/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { testhubService } from "@plane/services";
import { Input } from "@plane/ui";
import { testhubErrorMessage } from "../helpers/error-message";
import { TesthubPageBody } from "../components/page-shell";
import type { TTesthubOutletContext } from "../layout";

function BindPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, reload } = useOutletContext<TTesthubOutletContext>();
  const repo = catalog?.repo;
  const [repoUrl, setRepoUrl] = useState(repo?.repo_url ?? "");
  const [branch, setBranch] = useState(repo?.branch ?? "sandbox/jafron");
  const [workdir, setWorkdir] = useState(repo?.workdir ?? "/opt/testhub/workdir");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!repo) return;
    setRepoUrl(repo.repo_url);
    setBranch(repo.branch);
    setWorkdir(repo.workdir);
  }, [repo]);

  const save = async () => {
    if (!workspaceSlug || !projectId) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await testhubService.bindRepo(workspaceSlug, projectId, {
        repo_url: repoUrl,
        branch,
        workdir,
      });
      await reload();
      setMessage(t("testhub.bind.saved"));
    } catch (err) {
      setError(testhubErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <TesthubPageBody>
      <div className="mx-auto w-full max-w-xl space-y-4 py-5">
        <h2 className="text-16 font-medium text-primary">{t("testhub.bind.title")}</h2>
        <label className="block space-y-1">
          <span className="text-13 text-secondary">{t("testhub.bind.repo_url")}</span>
          <Input value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} className="w-full" />
        </label>
        <label className="block space-y-1">
          <span className="text-13 text-secondary">{t("testhub.bind.branch")}</span>
          <Input value={branch} onChange={(event) => setBranch(event.target.value)} className="w-full" />
        </label>
        <label className="block space-y-1">
          <span className="text-13 text-secondary">{t("testhub.bind.workdir")}</span>
          <Input value={workdir} onChange={(event) => setWorkdir(event.target.value)} className="w-full" />
        </label>
        <Button variant="primary" size="lg" onClick={save} loading={saving} disabled={saving}>
          {t("testhub.bind.save")}
        </Button>
        {message ? <p className="text-13 text-secondary">{message}</p> : null}
        {error ? <p className="text-13 text-danger-primary">{error}</p> : null}
      </div>
    </TesthubPageBody>
  );
}

export default observer(BindPage);
