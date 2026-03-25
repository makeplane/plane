/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";

// plane ui
import { RecentStickyIcon, PlusIcon, CloseIcon } from "@plane/propel/icons";
// hooks
import { useSticky } from "@/hooks/use-stickies";
// components
import { StickiesTruncated } from "../layout/stickies-truncated";
import { useStickyOperations } from "../sticky/use-operations";
import { StickySearch } from "./search";

type TProps = {
  handleClose?: () => void;
};

export const Stickies = observer(function Stickies(props: TProps) {
  const { handleClose } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { creatingSticky, toggleShowNewSticky } = useSticky();
  // sticky operations
  const { stickyOperations } = useStickyOperations({ workspaceSlug: workspaceSlug?.toString() });

  return (
    <div className="min-h-[620px] p-6 pb-0">
      {/* header */}
      <div className="mb-6 flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center gap-2 text-secondary">
          <RecentStickyIcon className="size-5 flex-shrink-0 rotate-90" />
          <p className="text-18 font-medium">Your stickies</p>
        </div>
        {/* actions */}
        <div className="flex gap-2">
          <StickySearch />
          <button
            onClick={() => {
              toggleShowNewSticky(true);
              stickyOperations.create();
            }}
            className="my-auto flex gap-1 text-13 font-medium text-accent-primary"
            disabled={creatingSticky}
          >
            <PlusIcon className="my-auto size-4" /> <span>Add sticky</span>
            {creatingSticky && (
              <div className="ml-2 flex items-center justify-center">
                <div
                  className={`h-4 w-4 animate-spin rounded-full border-2 border-accent-strong border-t-transparent`}
                  role="status"
                  aria-label="loading"
                />
              </div>
            )}
          </button>
          {handleClose && (
            <button
              type="button"
              onClick={handleClose}
              className="my-auto grid flex-shrink-0 place-items-center rounded-sm p-1 text-tertiary transition-colors hover:bg-layer-1 hover:text-primary"
            >
              <CloseIcon className="size-4 text-placeholder" />
            </button>
          )}
        </div>
      </div>
      {/* content */}
      <div className="mb-4 max-h-[625px] overflow-scroll">
        <StickiesTruncated handleClose={handleClose} />
      </div>
    </div>
  );
});
