/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// local imports
import { ContractChatPanel } from "./chat-panel";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
  /** Seeds the first message (Power K "search with AI") */
  initialQuery?: string;
};

/** General RAG chat over every analyzed contract, in a full-height modal */
export function ContractChatModal(props: Props) {
  const { workspaceSlug, isOpen, onClose, initialQuery } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={onClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.VIXL}
      className="flex flex-col overflow-hidden max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:rounded-none sm:h-[80vh]"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-subtle px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent-primary" />
          <span className="text-14 font-medium">{t("file_library.contracts.chat.title")}</span>
        </div>
        <button type="button" onClick={onClose} className="rounded-sm p-1.5 hover:bg-layer-1-hover">
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        {isOpen && (
          <ContractChatPanel
            workspaceSlug={workspaceSlug}
            mode="GENERAL"
            initialQuery={initialQuery}
            onOpenContract={(contractId) => {
              onClose();
              void navigate(`/${workspaceSlug}/file-library/contracts?peek=${contractId}`);
            }}
          />
        )}
      </div>
    </ModalCore>
  );
}
