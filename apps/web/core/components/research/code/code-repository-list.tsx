/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import {
  CODE_PROVIDERS,
  CODE_PROVIDER_LABELS,
  CODE_REF_TYPE_LABELS,
  CODE_REPOSITORY_STATUS_LABELS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { CodeSummaryCard } from "@/components/research/code/code-summary-card";
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

/**
 * Repositories, artifacts and snapshots. Plane never hosts Git: this page only
 * registers references and snapshots (P1-CODE-07).
 */
export const CodeRepositoryList = observer(function CodeRepositoryList({ workspaceSlug, projectId }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const repositories = research.getCodeRepositories(workspaceSlug, projectId);
  const summary = research.codeSummary[projectId];
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [provider, setProvider] = useState<string>("GITHUB");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [artifactRef, setArtifactRef] = useState("");
  const [refType, setRefType] = useState<string>("COMMIT");
  const [snapshotRef, setSnapshotRef] = useState("");
  const [snapshotFile, setSnapshotFile] = useState<File | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const loaded = await research.fetchCodeRepositories(workspaceSlug, projectId);
        await research.fetchCodeSummary(workspaceSlug, projectId).catch(() => undefined);
        setSelectedId((current) => current ?? loaded[0]?.id ?? null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectId]);

  useEffect(() => {
    if (!selectedId) return;
    void research.fetchCodeArtifacts(workspaceSlug, selectedId).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, workspaceSlug]);

  const artifacts = selectedId ? (research.codeArtifacts[selectedId] ?? []) : [];
  const selected = repositories.find((repository) => repository.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-5">
      <CodeSummaryCard summary={summary} />
      {errorKey && <p className="text-12 text-danger-primary">{t(errorKey)}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="!w-72"
          value={repositoryUrl}
          placeholder={t("research.code.repository_placeholder")}
          onChange={(event) => setRepositoryUrl(event.target.value)}
        />
        <select
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-12 text-primary"
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
        >
          {CODE_PROVIDERS.map((value) => (
            <option key={value} value={value}>
              {t(CODE_PROVIDER_LABELS[value])}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="primary"
          disabled={!repositoryUrl.trim()}
          onClick={async () => {
            try {
              const repository = await research.createCodeRepository(workspaceSlug, projectId, {
                repository_url: repositoryUrl.trim(),
                provider,
              });
              setRepositoryUrl("");
              setSelectedId(repository.id);
            } catch (error) {
              setErrorKey(getResearchErrorKey(error));
            }
          }}
        >
          {t("research.code.register")}
        </Button>
      </div>

      <table className="w-full text-12">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="font-normal py-2">{t("research.code.columns.repository")}</th>
            <th className="font-normal py-2">{t("research.code.columns.provider")}</th>
            <th className="font-normal py-2">{t("research.code.columns.status")}</th>
            <th className="font-normal py-2">{t("research.code.columns.last_sync")}</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {repositories.map((repository) => (
            <tr
              key={repository.id}
              className={`border-b border-subtle/60 ${repository.id === selectedId ? "bg-surface-2" : ""}`}
            >
              <td className="py-2 text-secondary">
                <button type="button" className="hover:underline" onClick={() => setSelectedId(repository.id)}>
                  {repository.repository_url}
                </button>
              </td>
              <td className="py-2 text-tertiary">{t(CODE_PROVIDER_LABELS[repository.provider])}</td>
              <td className="py-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-11 ${
                    repository.status === "ACTIVE"
                      ? "bg-success-subtle text-success-primary"
                      : repository.status === "SYNC_FAILED"
                        ? "bg-danger-subtle text-danger-primary"
                        : "bg-surface-2 text-tertiary"
                  }`}
                >
                  {t(CODE_REPOSITORY_STATUS_LABELS[repository.status])}
                </span>
                {repository.sync_error && <span className="ml-2 text-11 text-tertiary">{repository.sync_error}</span>}
              </td>
              <td className="py-2 text-tertiary">
                {repository.last_sync_at ? new Date(repository.last_sync_at).toLocaleString() : "-"}
              </td>
              <td className="py-2 text-right">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void research.syncCodeRepository(workspaceSlug, repository.id)}
                >
                  {t("research.code.sync")}
                </Button>
              </td>
            </tr>
          ))}
          {!repositories.length && (
            <tr>
              <td colSpan={5} className="py-3 text-tertiary">
                {t("research.code.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selected && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-12 text-primary"
              value={refType}
              onChange={(event) => setRefType(event.target.value)}
            >
              {(["COMMIT", "BRANCH", "TAG"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(CODE_REF_TYPE_LABELS[value])}
                </option>
              ))}
            </select>
            <Input
              className="!w-64"
              value={artifactRef}
              placeholder={t("research.code.ref_placeholder")}
              onChange={(event) => setArtifactRef(event.target.value)}
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!artifactRef.trim()}
              onClick={async () => {
                try {
                  await research.createCodeArtifact(workspaceSlug, selected.id, {
                    ref_type: refType,
                    ref_value: artifactRef.trim(),
                  });
                  setArtifactRef("");
                } catch (error) {
                  setErrorKey(getResearchErrorKey(error));
                }
              }}
            >
              {t("research.code.add_artifact")}
            </Button>
            <Input
              className="!w-32"
              value={snapshotRef}
              placeholder={t("research.code.snapshot_ref")}
              onChange={(event) => setSnapshotRef(event.target.value)}
            />
            <input
              type="file"
              className="text-11 text-secondary"
              onChange={(event) => setSnapshotFile(event.target.files?.[0] ?? null)}
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!snapshotFile || !snapshotRef.trim()}
              onClick={async () => {
                if (!snapshotFile) return;
                try {
                  await research.uploadCodeSnapshot(workspaceSlug, selected.id, {
                    file: snapshotFile,
                    ref_value: snapshotRef.trim(),
                  });
                  setSnapshotFile(null);
                  setSnapshotRef("");
                } catch (error) {
                  setErrorKey(getResearchErrorKey(error));
                }
              }}
            >
              {t("research.code.upload_snapshot")}
            </Button>
          </div>

          <table className="w-full text-12">
            <thead>
              <tr className="border-b border-subtle text-left text-tertiary">
                <th className="font-normal py-2">{t("research.code.columns.ref_type")}</th>
                <th className="font-normal py-2">{t("research.code.columns.ref_value")}</th>
                <th className="font-normal py-2">{t("research.code.columns.message")}</th>
                <th className="font-normal py-2">{t("research.code.columns.experiment")}</th>
              </tr>
            </thead>
            <tbody>
              {artifacts.map((artifact) => (
                <tr key={artifact.id} className="border-b border-subtle/60">
                  <td className="py-2 text-tertiary">{t(CODE_REF_TYPE_LABELS[artifact.ref_type])}</td>
                  <td className="py-2 text-secondary">{artifact.ref_value}</td>
                  <td className="py-2 text-tertiary">{artifact.commit_message || "-"}</td>
                  <td className="py-2 text-tertiary">{artifact.linked_experiment ? t("research.code.linked") : "-"}</td>
                </tr>
              ))}
              {!artifacts.length && (
                <tr>
                  <td colSpan={4} className="py-3 text-tertiary">
                    {t("research.code.no_artifacts")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
