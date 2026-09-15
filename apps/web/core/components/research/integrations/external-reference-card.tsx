/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EXTERNAL_TYPE_LABELS, INTEGRATION_SYSTEM_LABELS } from "@plane/constants";
// plane imports
import type { TExternalReference } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  reference: TExternalReference;
  onRemove?: () => void;
};

/**
 * External reference card: always states which system owns the object, never
 * offers an in-Plane edit (P1-KB-06, P1-UI-06).
 */
export const ExternalReferenceCard = observer(function ExternalReferenceCard({ reference, onRemove }: Props) {
  const { t } = useTranslation();
  const degraded = reference.status !== "ACTIVE";
  return (
    <div className="flex flex-col gap-1 rounded border border-subtle px-3 py-2 text-12">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-primary">{reference.title}</span>
        <span className="flex items-center gap-2 text-11">
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-secondary">
            {t(INTEGRATION_SYSTEM_LABELS[reference.system])}
          </span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-tertiary">
            {t(EXTERNAL_TYPE_LABELS[reference.external_type] ?? reference.external_type)}
          </span>
          {degraded && (
            <span className="rounded bg-danger-subtle px-1.5 py-0.5 text-danger-primary">
              {t("research.integrations.degraded_hint")}
            </span>
          )}
        </span>
      </div>
      {reference.summary && <span className="text-tertiary">{reference.summary}</span>}
      <div className="flex items-center gap-3 text-11">
        <a className="text-accent-primary hover:underline" href={reference.source_url} target="_blank" rel="noreferrer">
          {t("research.integrations.open_source")}
        </a>
        <span className="text-tertiary">{t("research.integrations.managed_by", { system: reference.system })}</span>
        {reference.synced_at && <span className="text-tertiary">{new Date(reference.synced_at).toLocaleString()}</span>}
        {onRemove && (
          <button type="button" className="text-danger-primary hover:underline" onClick={onRemove}>
            {t("research.common.remove")}
          </button>
        )}
      </div>
    </div>
  );
});
