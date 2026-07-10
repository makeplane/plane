/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FileText } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TContract, TContractJob } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { CONTRACT_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS } from "./constants";
import { ProcessingBadge } from "./processing-badge";

type Props = {
  contracts: TContract[];
  /** contract_id -> latest active job (live progress from polling) */
  activeJobsByContract: Record<string, TContractJob>;
  selectedContractId: string | null;
  onSelect: (contract: TContract) => void;
};

const statusLabelKey = (value: string | null) =>
  CONTRACT_STATUS_OPTIONS.find((o) => o.value === value)?.i18nKey ?? null;
const typeLabelKey = (value: string | null) => CONTRACT_TYPE_OPTIONS.find((o) => o.value === value)?.i18nKey ?? null;

export function ContractsTable(props: Props) {
  const { contracts, activeJobsByContract, selectedContractId, onSelect } = props;
  const { t } = useTranslation();

  if (contracts.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-tertiary">
        <FileText className="size-8" />
        <p className="text-14 font-medium">{t("file_library.contracts.empty.title")}</p>
        <p className="max-w-sm text-center text-12">{t("file_library.contracts.empty.description")}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full min-w-[860px] border-collapse text-left">
        <thead className="sticky top-0 z-[1] bg-surface-1">
          <tr className="border-b border-subtle text-11 font-medium text-tertiary">
            <th className="px-4 py-2">{t("file_library.contracts.fields.titulo")}</th>
            <th className="px-3 py-2">{t("file_library.contracts.fields.artistas")}</th>
            <th className="px-3 py-2">{t("file_library.contracts.fields.tipo_contrato")}</th>
            <th className="px-3 py-2">{t("file_library.contracts.fields.estatus_contrato")}</th>
            <th className="px-3 py-2">{t("file_library.contracts.fields.fecha_inicio")}</th>
            <th className="px-3 py-2">{t("file_library.contracts.fields.fecha_fin")}</th>
            <th className="px-3 py-2">{t("file_library.contracts.fields.fecha_fin_efectiva")}</th>
            <th className="px-3 py-2">{t("file_library.contracts.fields.processing_status")}</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => {
            const statusKey = statusLabelKey(contract.estatus_contrato);
            const typeKey = typeLabelKey(contract.tipo_contrato);
            return (
              <tr
                key={contract.id}
                onClick={() => onSelect(contract)}
                className={cn(
                  "cursor-pointer border-b border-subtle text-13 hover:bg-layer-1-hover",
                  selectedContractId === contract.id ? "bg-layer-1" : ""
                )}
              >
                <td className="max-w-64 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 shrink-0 text-danger-primary" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{contract.titulo ?? contract.file_name ?? "—"}</p>
                      {contract.titulo && contract.file_name && (
                        <p className="truncate text-11 text-tertiary">{contract.file_name}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="max-w-48 truncate px-3 py-2.5">{contract.artistas ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{typeKey ? t(typeKey) : "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {statusKey ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-11 font-medium",
                        contract.estatus_contrato === "VIGENTE"
                          ? "bg-success-subtle text-success-primary"
                          : contract.estatus_contrato === "FINALIZADO"
                            ? "bg-layer-1 text-tertiary"
                            : "bg-layer-1 text-secondary"
                      )}
                    >
                      {t(statusKey)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{contract.fecha_inicio ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{contract.fecha_fin ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{contract.fecha_fin_efectiva ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <ProcessingBadge contract={contract} activeJob={activeJobsByContract[contract.id]} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
