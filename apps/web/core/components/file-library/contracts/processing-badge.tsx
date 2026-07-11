/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import type { TContract, TContractJob } from "@plane/types";
import { cn } from "@plane/utils";

type Props = {
  contract: TContract;
  /** Latest active job for this contract, if any (drives live progress) */
  activeJob?: TContractJob;
};

/** Live pipeline state chip: stage + % while running, terminal state otherwise */
export function ProcessingBadge(props: Props) {
  const { contract, activeJob } = props;
  const { t } = useTranslation();

  if (activeJob || contract.processing_status === "PROCESSING") {
    const stage = activeJob?.current_stage;
    const progress = activeJob?.progress ?? 0;
    return (
      <Tooltip tooltipContent={stage ?? t("file_library.contracts.processing.processing")}>
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent-primary/10 px-2 py-0.5 text-11 font-medium text-accent-primary">
          <Loader2 className="size-3 shrink-0 animate-spin" />
          <span className="truncate">{stage ?? t("file_library.contracts.processing.processing")}</span>
          <span className="shrink-0 tabular-nums">{progress}%</span>
        </span>
      </Tooltip>
    );
  }

  const config = {
    PENDING: { icon: Clock, className: "bg-layer-1 text-tertiary", label: t("file_library.contracts.processing.pending") },
    COMPLETED: {
      icon: CheckCircle2,
      className: "bg-success-subtle text-success-primary",
      label: t("file_library.contracts.processing.completed"),
    },
    ERROR: {
      icon: AlertTriangle,
      className: "bg-danger-subtle text-danger-primary",
      label: t("file_library.contracts.processing.error"),
    },
  }[contract.processing_status];

  const Icon = config.icon;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-11 font-medium", config.className)}
    >
      <Icon className="size-3 shrink-0" />
      {config.label}
    </span>
  );
}
