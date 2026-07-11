/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Loader2, Mail, Search, Sparkles } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// services
import { contractService } from "@/services/contract.service";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Natural-language search over every analyzed contract. The query runs as a
 * background workflow (it reads each contract's full text), so the result
 * lands here when it finishes and is also emailed to the requester.
 */
export function ContractQueryModal(props: Props) {
  const { workspaceSlug, isOpen, onClose } = props;
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: queries, mutate } = useSWR(
    isOpen ? `CONTRACT_QUERIES_${workspaceSlug}` : null,
    () => contractService.getQueries(workspaceSlug),
    {
      refreshInterval: (latest) =>
        latest?.some((item) => item.status === "QUEUED" || item.status === "RUNNING") ? 3000 : 0,
    }
  );

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await contractService.createQuery(workspaceSlug, trimmed);
      setQuery("");
      await mutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("file_library.contracts.query.started") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("file_library.contracts.query.failed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXXL}>
      <div className="flex max-h-[80vh] flex-col p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent-primary" />
          <h3 className="text-16 font-medium">{t("file_library.contracts.query.title")}</h3>
        </div>
        <p className="mt-1 text-12 text-tertiary">{t("file_library.contracts.query.description")}</p>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSubmit();
              }}
              placeholder={t("file_library.contracts.query.placeholder")}
              className="w-full rounded-md border border-subtle bg-transparent py-2 pl-8 pr-3 text-13"
            />
          </div>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isSubmitting || !query.trim()}>
            {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : t("file_library.contracts.query.submit")}
          </Button>
        </div>

        {/* history + results */}
        <div className="mt-4 min-h-0 flex-1 space-y-2.5 overflow-y-auto">
          {(queries ?? []).map((item) => {
            const isActive = item.status === "QUEUED" || item.status === "RUNNING";
            return (
              <div key={item.id} className="rounded-md border border-subtle p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-13 font-medium">{item.query}</p>
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-11 font-medium",
                      isActive
                        ? "bg-accent-primary/10 text-accent-primary"
                        : item.status === "COMPLETED"
                          ? "bg-success-subtle text-success-primary"
                          : "bg-danger-subtle text-danger-primary"
                    )}
                  >
                    {isActive && <Loader2 className="size-3 animate-spin" />}
                    {t(`file_library.contracts.job_status.${item.status.toLowerCase()}`)}
                  </span>
                </div>
                {item.result?.summary && <p className="mt-1.5 text-12 text-secondary">{item.result.summary}</p>}
                {(item.result?.matches ?? []).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {(item.result?.matches ?? []).map((match) => (
                      <div key={match.contract_id} className="rounded-sm bg-layer-1 px-2 py-1.5 text-12">
                        <p className="font-medium">{match.title}</p>
                        <p className="text-11 text-tertiary">
                          {[match.artists, match.start_date, match.final_end_date ?? match.end_date]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {match.reason && <p className="mt-0.5 text-11 text-secondary">{match.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-2 text-10 text-tertiary">
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                  {item.emailed_at && (
                    <span className="flex items-center gap-1">
                      <Mail className="size-3" />
                      {t("file_library.contracts.query.emailed")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {(queries ?? []).length === 0 && (
            <p className="py-6 text-center text-12 text-tertiary">{t("file_library.contracts.query.empty")}</p>
          )}
        </div>
      </div>
    </ModalCore>
  );
}
