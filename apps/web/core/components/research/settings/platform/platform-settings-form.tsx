/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { REPORT_VISIBILITIES, REPORT_VISIBILITY_LABELS } from "@plane/constants";
import type { TReportVisibility } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TWorkspaceResearchSetting } from "@plane/types";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
};

const TOGGLES: { field: keyof TWorkspaceResearchSetting; labelKey: string }[] = [
  { field: "module_enabled", labelKey: "research.platform.module_enabled" },
  { field: "org_enabled", labelKey: "research.platform.org_enabled" },
  { field: "report_enabled", labelKey: "research.platform.report_enabled" },
  { field: "approval_enabled", labelKey: "research.platform.approval_enabled" },
  { field: "allow_multiple_projects", labelKey: "research.platform.allow_multiple_projects" },
];

const LIMITS: { field: keyof TWorkspaceResearchSetting; labelKey: string }[] = [
  { field: "image_max_mb", labelKey: "research.platform.image_max_mb" },
  { field: "pdf_max_mb", labelKey: "research.platform.pdf_max_mb" },
  { field: "markdown_max_mb", labelKey: "research.platform.markdown_max_mb" },
  { field: "audit_retention_days", labelKey: "research.platform.audit_retention_days" },
];

/**
 * Research platform configuration: module switches, upload limits and the
 * default visibility policy (P0-CFG-01 ~ P0-CFG-08, P0-UI-08).
 */
export const ResearchPlatformSettingsForm = observer(function ResearchPlatformSettingsForm({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [draft, setDraft] = useState<TWorkspaceResearchSetting | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const settings = await research.fetchSettings(workspaceSlug);
      setDraft(settings);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  const handleSave = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const payload = {
        module_enabled: draft.module_enabled,
        org_enabled: draft.org_enabled,
        report_enabled: draft.report_enabled,
        approval_enabled: draft.approval_enabled,
        allow_multiple_projects: draft.allow_multiple_projects,
        default_report_visibility: draft.default_report_visibility,
        weekly_default_visibility: draft.weekly_default_visibility ?? null,
        monthly_default_visibility: draft.monthly_default_visibility ?? null,
        image_max_mb: draft.image_max_mb,
        pdf_max_mb: draft.pdf_max_mb,
        markdown_max_mb: draft.markdown_max_mb,
        audit_retention_days: draft.audit_retention_days,
        timezone: draft.timezone,
      };
      const updated = await research.updateSettings(workspaceSlug, payload);
      if (updated) setDraft(updated);
      await research.fetchIdentity(workspaceSlug).catch(() => undefined);
      setSavedAt(Date.now());
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setSaving(false);
    }
  }, [draft, research, workspaceSlug]);

  if (!draft) {
    return <p className="p-5 text-13 text-tertiary">{t("research.common.loading")}</p>;
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}
      {savedAt && !errorKey && <p className="text-12 text-tertiary">{t("research.common.saved")}</p>}

      <section className="rounded-lg border border-subtle bg-surface-1 p-4">
        <h3 className="text-13 font-medium text-primary">{t("research.platform.switches")}</h3>
        <div className="mt-3 flex flex-col gap-3">
          {TOGGLES.map((item) => (
            <label key={item.field} className="flex items-center justify-between gap-4 text-12 text-secondary">
              <span>{t(item.labelKey)}</span>
              <input
                type="checkbox"
                checked={Boolean(draft[item.field])}
                onChange={(event) => setDraft({ ...draft, [item.field]: event.target.checked })}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-subtle bg-surface-1 p-4">
        <h3 className="text-13 font-medium text-primary">{t("research.platform.visibility")}</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {(
            [
              ["default_report_visibility", "research.platform.default_visibility"],
              ["weekly_default_visibility", "research.platform.weekly_visibility"],
              ["monthly_default_visibility", "research.platform.monthly_visibility"],
            ] as const
          ).map(([field, labelKey]) => (
            <label key={field} className="flex flex-col gap-1 text-12 text-secondary">
              <span>{t(labelKey)}</span>
              <select
                className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-12 text-primary"
                value={(draft[field] as string | null) ?? ""}
                onChange={(event) => setDraft({ ...draft, [field]: event.target.value || null })}
              >
                {field !== "default_report_visibility" && <option value="">{t("research.platform.inherit")}</option>}
                {REPORT_VISIBILITIES.map((visibility: TReportVisibility) => (
                  <option key={visibility} value={visibility}>
                    {t(REPORT_VISIBILITY_LABELS[visibility])}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <label className="mt-3 flex flex-col gap-1 text-12 text-secondary">
          <span>{t("research.platform.timezone")}</span>
          <Input
            value={draft.timezone ?? ""}
            placeholder="Asia/Shanghai"
            onChange={(event) => setDraft({ ...draft, timezone: event.target.value || null })}
          />
        </label>
      </section>

      <section className="rounded-lg border border-subtle bg-surface-1 p-4">
        <h3 className="text-13 font-medium text-primary">{t("research.platform.limits")}</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
          {LIMITS.map((item) => (
            <label key={item.field} className="flex flex-col gap-1 text-12 text-secondary">
              <span>{t(item.labelKey)}</span>
              <Input
                type="number"
                min={0}
                value={String(draft[item.field] ?? 0)}
                onChange={(event) => setDraft({ ...draft, [item.field]: Number(event.target.value) })}
              />
            </label>
          ))}
        </div>
        <p className="mt-2 text-11 text-tertiary">{t("research.platform.limits_hint")}</p>
      </section>

      <div className="flex justify-end">
        <Button variant="primary" size="lg" loading={saving} onClick={() => void handleSave()}>
          {t("research.common.save")}
        </Button>
      </div>
    </div>
  );
});
