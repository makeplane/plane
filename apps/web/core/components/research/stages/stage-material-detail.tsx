/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import {
  STAGE_MATERIAL_CHANGE_SOURCE_LABELS,
  STAGE_MATERIAL_STATUS_LABELS,
  stageMaterialLabelKey,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";
import { useUser } from "@/hooks/store/user";

type Props = {
  workspaceSlug: string;
  projectId: string;
  stageCode: string;
  materialId: string;
};

/**
 * Material detail: metadata, version history and the link into the shared Page
 * editor (P1-OPN-04, P1-OPN-05). Every save appends a version; nothing here
 * can overwrite an earlier one.
 */
export const StageMaterialDetail = observer(function StageMaterialDetail({
  workspaceSlug,
  projectId,
  stageCode,
  materialId,
}: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const { data: currentUser } = useUser();
  const material = research.stageMaterials[materialId];
  const versions = research.materialVersions[materialId] ?? [];
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const load = useCallback(async () => {
    try {
      const detail = await research.fetchStageMaterial(workspaceSlug, materialId);
      setTitle(detail.page_detail?.name ?? "");
      await research.fetchMaterialVersions(workspaceSlug, materialId);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId, workspaceSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setBusy(true);
      try {
        await action();
        await load();
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      } finally {
        setBusy(false);
      }
    },
    [load]
  );

  if (errorKey) return <p className="p-5 text-13 text-danger-primary">{t(errorKey)}</p>;
  if (!material) return null;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-14 font-medium text-primary">{t(stageMaterialLabelKey(material.material_type))}</h2>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-11 text-secondary">
            {t(STAGE_MATERIAL_STATUS_LABELS[material.status])}
          </span>
          <span className="text-11 text-tertiary">
            {t("research.stages.materials.version", { version: material.last_version_no })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="text-12 text-accent-primary hover:underline"
            href={`/${workspaceSlug}/projects/${projectId}/pages/${material.page}`}
          >
            {t("research.stages.materials.open_editor")}
          </Link>
          {material.can_edit && (
            <Button
              size="sm"
              variant="primary"
              disabled={busy}
              onClick={() => void run(() => research.submitStageMaterial(workspaceSlug, materialId))}
            >
              {t("research.stages.materials.submit")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-12 text-secondary" htmlFor="material-title">
          {t("research.stages.materials.title_field")}
        </label>
        <Input id="material-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <label className="text-12 text-secondary" htmlFor="material-reason">
          {t("research.stages.materials.change_reason")}
        </label>
        <Input id="material-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        <div>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !material.can_edit}
            onClick={() =>
              void run(() =>
                research.updateStageMaterial(workspaceSlug, materialId, {
                  title,
                  reason: reason.trim() || undefined,
                })
              )
            }
          >
            {t("research.common.save")}
          </Button>
        </div>
        {!material.can_edit && <p className="text-11 text-tertiary">{t("research.stages.materials.read_only_hint")}</p>}
        {!material.can_edit && research.isWorkspaceAdmin && (
          <div className="flex flex-col gap-2 rounded border border-subtle p-2">
            <p className="text-12 text-secondary">{t("research.stages.materials.override_hint")}</p>
            <Input
              value={overrideReason}
              placeholder={t("research.stages.materials.override_reason")}
              onChange={(event) => setOverrideReason(event.target.value)}
            />
            <div>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy || !overrideReason.trim()}
                onClick={() => {
                  void run(() =>
                    research.overrideStageMaterial(workspaceSlug, materialId, {
                      reason: overrideReason.trim(),
                      title,
                    })
                  );
                  setOverrideReason("");
                }}
              >
                {t("research.stages.materials.override")}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-13 font-medium text-primary">{t("research.stages.materials.versions_title")}</h3>
        {versions.map((version) => (
          <div key={version.id} className="flex flex-col gap-0.5 rounded border border-subtle px-2 py-1.5 text-12">
            <div className="flex items-center justify-between gap-2">
              <span className="text-primary">
                {t("research.stages.materials.version", { version: version.version_no })}
                {` · ${t(STAGE_MATERIAL_CHANGE_SOURCE_LABELS[version.change_source] ?? version.change_source)}`}
              </span>
              <span className="text-11 text-tertiary">{new Date(version.created_at).toLocaleString()}</span>
            </div>
            {version.reason && <span className="text-tertiary">{version.reason}</span>}
            {Array.isArray((version.diff_summary as { changed?: string[] })?.changed) && (
              <span className="text-11 text-tertiary">
                {t("research.stages.materials.changed_fields")}
                {`: ${((version.diff_summary as { changed?: string[] }).changed ?? []).join(", ")}`}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="text-11 text-tertiary">{t("research.stages.materials.stage_hint", { stage: stageCode })}</p>
      {currentUser && <span className="text-11 text-tertiary">{t("research.stages.materials.reviewer_hint")}</span>}
    </div>
  );
});
