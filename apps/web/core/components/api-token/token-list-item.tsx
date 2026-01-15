import { useState } from "react";
import { XCircle } from "lucide-react";
// plane imports
import { PROFILE_SETTINGS_TRACKER_ELEMENTS } from "@plane/constants";
import { Tooltip } from "@plane/propel/tooltip";
import type { IApiToken } from "@plane/types";
import { renderFormattedDate, calculateTimeAgo, renderFormattedTime } from "@plane/utils";
// components
import { DeleteApiTokenModal } from "@/components/api-token/delete-token-modal";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  token: IApiToken;
};

export function ApiTokenListItem(props: Props) {
  const { token } = props;
  // states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <>
      <DeleteApiTokenModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} tokenId={token.id} />
      <div className="group relative flex flex-col justify-center border-b border-subtle py-3">
        <Tooltip tooltipContent="Delete token" isMobile={isMobile}>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="absolute right-4 hidden place-items-center group-hover:grid"
            data-ph-element={PROFILE_SETTINGS_TRACKER_ELEMENTS.LIST_ITEM_DELETE_ICON}
          >
            <XCircle className="h-4 w-4 text-danger-primary" />
          </button>
        </Tooltip>
        <div className="flex w-4/5 items-center">
          <h5 className="truncate text-13 font-medium">{token.label}</h5>
          <span
            className={`${
              token.is_active ? "bg-success-subtle text-success-primary" : "bg-layer-1 text-placeholder"
            } ml-2 flex h-4 max-h-fit items-center rounded-xs px-2 text-11 font-medium`}
          >
            {token.is_active ? "Active" : "Expired"}
          </span>
        </div>
        <div className="mt-1 flex w-full flex-col justify-center">
          {token.description.trim() !== "" && (
            <p className="mb-1 max-w-[70%] break-words text-13">{token.description}</p>
          )}
          <p className="mb-1 text-11 leading-6 text-placeholder">
            {token.is_active
              ? token.expired_at
                ? `Expires ${renderFormattedDate(token.expired_at)} at ${renderFormattedTime(token.expired_at)}`
                : "Never expires"
              : `Expired ${calculateTimeAgo(token.expired_at)}`}
          </p>
        </div>
      </div>
    </>
  );
}
