/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { LITERATURE_STATUSES, LITERATURE_STATUS_LABELS } from "@plane/constants";
import type { TLiteratureCounters } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  counters?: TLiteratureCounters;
  active?: string;
  onSelect: (status: string) => void;
};

const COUNTER_KEYS: Record<string, keyof TLiteratureCounters> = {
  COLLECTED: "collected",
  SCREENED: "screened",
  INCLUDED: "included",
  EXCLUDED: "excluded",
};

/** Status board with the counters that drive the pre-opening gate (P1-LIT-02). */
export const LiteratureStatusBoard = observer(function LiteratureStatusBoard({ counters, active, onSelect }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {LITERATURE_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onSelect(active === status ? "" : status)}
          className={`flex items-center gap-1 rounded border px-2 py-1 text-12 ${
            active === status ? "border-accent-strong bg-surface-2 text-primary" : "border-subtle text-secondary"
          }`}
        >
          {t(LITERATURE_STATUS_LABELS[status])}
          <span className="text-11 text-tertiary">{counters ? counters[COUNTER_KEYS[status]] : 0}</span>
        </button>
      ))}
    </div>
  );
});
