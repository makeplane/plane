/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { CloseCircleOutline } from "@makeplane/propel/icons";
// plane imports
import { Badge } from "@makeplane/propel/components/badge";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Tooltip } from "@makeplane/propel/components/tooltip";
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
      <div className="group relative flex flex-col justify-center px-4 py-3">
        <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <Tooltip label="Delete token" disabled={isMobile}>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Delete token"
              icon={<Icon icon={CloseCircleOutline} />}
              onClick={() => setDeleteModalOpen(true)}
            />
          </Tooltip>
        </div>
        <div className="flex w-4/5 items-center gap-2">
          <h5 className="truncate text-body-sm-medium">{token.label}</h5>
          <Badge
            variant={token.is_active ? "success" : "neutral"}
            size="sm"
            label={token.is_active ? "Active" : "Expired"}
          />
        </div>
        <div className="mt-1 flex w-full flex-col justify-center">
          {token.description.trim() !== "" && (
            <p className="mb-1 max-w-[70%] text-body-xs-regular break-words">{token.description}</p>
          )}
          <p className="mb-1 text-caption-sm-regular leading-6 text-placeholder">
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
