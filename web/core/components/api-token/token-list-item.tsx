"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";
import { IApiToken } from "@plane/types";
// components
import { Tooltip } from "@plane/ui";
import { DeleteApiTokenModal } from "@/components/api-token";
import { renderFormattedDate, calculateTimeAgo } from "@/helpers/date-time.helper";
import { usePlatformOS } from "@/hooks/use-platform-os";
// ui
// helpers
// types

type Props = {
  token: IApiToken;
};

export const ApiTokenListItem: React.FC<Props> = (props) => {
  const { token } = props;
  // states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <>
      <DeleteApiTokenModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} tokenId={token.id} />
      <div className="group relative flex flex-col justify-center border-b border-custom-border-200 px-4 py-3">
        <Tooltip tooltipContent="Delete token" isMobile={isMobile}>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="absolute right-4 hidden place-items-center group-hover:grid"
          >
            <XCircle className="h-4 w-4 text-red-500" />
          </button>
        </Tooltip>
        <div className="flex w-4/5 items-center">
          <h5 className="truncate text-sm font-medium">{token.label}</h5>
          <span
            className={`${
              token.is_active ? "bg-green-500/10 text-green-500" : "bg-custom-background-80 text-custom-text-400"
            } ml-2 flex h-4 max-h-fit items-center rounded-sm px-2 text-xs font-medium`}
          >
            {token.is_active ? "Active" : "Expired"}
          </span>
        </div>
        <div className="mt-1 flex w-full flex-col justify-center">
          {token.description.trim() !== "" && (
            <p className="mb-1 max-w-[70%] break-words text-sm">{token.description}</p>
          )}
          <p className="mb-1 text-xs leading-6 text-custom-text-400">
            {token.is_active
              ? token.expired_at
                ? `Expires ${renderFormattedDate(token.expired_at!)}`
                : "Never expires"
              : `Expired ${calculateTimeAgo(token.expired_at)}`}
          </p>
        </div>
      </div>
    </>
  );
};
