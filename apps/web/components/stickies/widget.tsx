/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";

// plane imports
import { useTranslation } from "@plane/i18n";
import { AddOutline } from "@makeplane/propel/icons";
import { Button } from "@makeplane/propel/components/button";
// hooks
import { useSticky } from "@/hooks/use-stickies";
// local imports
import { StickiesTruncated } from "./layout/stickies-truncated";
import { StickySearch } from "./modal/search";
import { useStickyOperations } from "./sticky/use-operations";

export const StickiesWidget = observer(function StickiesWidget() {
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { creatingSticky, toggleShowNewSticky } = useSticky();
  const { t } = useTranslation();
  // sticky operations
  const { stickyOperations } = useStickyOperations({
    workspaceSlug: workspaceSlug?.toString() ?? "",
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-body-sm-semibold text-tertiary">{t("stickies.title")}</div>
        {/* actions */}
        <div className="flex items-center gap-2">
          <StickySearch />
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            icon={<AddOutline />}
            label={t("stickies.add")}
            loading={creatingSticky}
            onClick={() => {
              toggleShowNewSticky(true);
              stickyOperations.create();
            }}
          />
        </div>
      </div>
      {/* clip the -mx-2 bleed so the sticky grid never adds a horizontal scrollbar */}
      <div className="overflow-x-clip">
        <div className="-mx-2">
          <StickiesTruncated />
        </div>
      </div>
    </div>
  );
});
