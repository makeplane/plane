/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { STAGE_MATERIAL_STATUS_LABELS, STAGE_MATERIAL_TYPES, stageMaterialLabelKey } from "@plane/constants";
import type { TStageMaterialStatus } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  workspaceSlug: string;
  projectId: string;
  stageId: string;
  stageCode: string;
  materials: Array<{
    id: string;
    material_type: string;
    status: TStageMaterialStatus;
    last_version_no: number;
    can_edit?: boolean;
  }>;
  canEdit: boolean;
  onCreate: (materialType: string) => Promise<void>;
};

const STATUS_TONES: Record<TStageMaterialStatus, string> = {
  DRAFT: "bg-surface-2 text-tertiary",
  SUBMITTED: "bg-warning-subtle text-warning-primary",
  ACCEPTED: "bg-success-subtle text-success-primary",
  REJECTED: "bg-danger-subtle text-danger-primary",
};

/**
 * Material checklist for one stage: required items come from the stage
 * definition, so a missing item is visible before the gate is run (P1-UI-02).
 */
export const StageMaterialList = observer(function StageMaterialList({
  workspaceSlug,
  projectId,
  stageCode,
  materials,
  canEdit,
  onCreate,
}: Props) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<string | null>(null);
  const requiredTypes = STAGE_MATERIAL_TYPES[stageCode as keyof typeof STAGE_MATERIAL_TYPES] ?? [];
  const byType = new Map(materials.map((material) => [material.material_type, material]));

  const handleCreate = useCallback(
    async (materialType: string) => {
      setPending(materialType);
      try {
        await onCreate(materialType);
      } finally {
        setPending(null);
      }
    },
    [onCreate]
  );

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-13 font-medium text-primary">{t("research.stages.materials.title")}</h3>
      <div className="flex flex-col gap-1">
        {requiredTypes.map((materialType) => {
          const material = byType.get(materialType);
          return (
            <div
              key={materialType}
              className="flex items-center justify-between gap-2 rounded border border-subtle px-2 py-1.5 text-12"
            >
              <span className="text-primary">{t(stageMaterialLabelKey(materialType))}</span>
              <span className="flex items-center gap-2">
                {material ? (
                  <>
                    <span
                      className={`rounded px-1.5 py-0.5 text-11 ${STATUS_TONES[material.status] ?? "bg-surface-2"}`}
                    >
                      {t(STAGE_MATERIAL_STATUS_LABELS[material.status])}
                    </span>
                    <span className="text-11 text-tertiary">v{material.last_version_no}</span>
                    <Link
                      className="text-11 text-accent-primary hover:underline"
                      href={`/${workspaceSlug}/research/projects/${projectId}/stages/${stageCode}/materials/${material.id}`}
                    >
                      {t("research.common.open")}
                    </Link>
                  </>
                ) : canEdit ? (
                  <button
                    type="button"
                    disabled={pending === materialType}
                    onClick={() => void handleCreate(materialType)}
                    className="rounded border border-subtle px-2 py-0.5 text-11 text-secondary hover:bg-surface-2 disabled:opacity-50"
                  >
                    {t("research.stages.materials.create")}
                  </button>
                ) : (
                  <span className="text-11 text-tertiary">{t("research.stages.materials.missing")}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
