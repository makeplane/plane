/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext, useContext } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { motion } from "framer-motion";
import { Download, ExternalLink, FileText } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TContractChatSource } from "@plane/types";
// services
import { fileLibraryService } from "@/services/file-library.service";

export const SOURCES_TOOL_NAME = "mostrar_contratos";

/** Workspace context the tool UI needs to build file URLs / navigation */
export const ChatSourcesContext = createContext<{
  workspaceSlug: string;
  onOpenContract?: (contractId: string) => void;
}>({ workspaceSlug: "" });

function SourceCard({ source }: { source: TContractChatSource }) {
  const { t } = useTranslation();
  const { workspaceSlug, onOpenContract } = useContext(ChatSourcesContext);
  const name = source.title || source.file_name || source.contract_id;

  return (
    <div className="flex items-center gap-2 rounded-md border border-subtle bg-layer-1 px-2.5 py-2">
      <FileText className="size-4 shrink-0 text-danger-primary" />
      <button
        type="button"
        className="min-w-0 flex-1 truncate text-left text-12 font-medium hover:text-accent-primary"
        title={name}
        onClick={() => onOpenContract?.(source.contract_id)}
      >
        {name}
        {source.file_name && source.title && <span className="ml-1.5 text-11 text-tertiary">{source.file_name}</span>}
      </button>
      <span className="shrink-0 rounded-full bg-layer-1 px-1.5 text-10 tabular-nums text-tertiary">
        {(source.similarity * 100).toFixed(0)}%
      </span>
      {source.asset_id && (
        <>
          {/* Open the PDF in a new window (redirects to the presigned URL) */}
          <a
            href={fileLibraryService.getFileViewUrl(workspaceSlug, source.asset_id)}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-sm p-1 hover:bg-layer-1-hover"
            title={t("file_library.contracts.chat.open_document")}
          >
            <ExternalLink className="size-3.5" />
          </a>
          <a
            href={fileLibraryService.getFileDownloadUrl(workspaceSlug, source.asset_id)}
            className="shrink-0 rounded-sm p-1 hover:bg-layer-1-hover"
            title={t("file_library.download")}
          >
            <Download className="size-3.5" />
          </a>
        </>
      )}
    </div>
  );
}

/** Tool UI: the documents the assistant grounded its answer on */
export const ContractSourcesToolUI = makeAssistantToolUI<{ sources: TContractChatSource[] }, unknown>({
  toolName: SOURCES_TOOL_NAME,
  render: function ContractSourcesRender({ args }) {
    const { t } = useTranslation();
    const sources = args?.sources ?? [];
    if (sources.length === 0) return null;
    return (
      <div className="mt-2 space-y-1.5">
        <p className="text-11 font-medium text-tertiary">{t("file_library.contracts.chat.sources_used")}</p>
        {sources.map((source, index) => (
          <motion.div
            key={source.contract_id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05, ease: "easeOut" }}
          >
            <SourceCard source={source} />
          </motion.div>
        ))}
      </div>
    );
  },
});
