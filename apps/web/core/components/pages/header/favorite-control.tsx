/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { StarOutline } from "@makeplane/propel/icons";
// ui
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
// hooks
import { usePageOperations } from "@/hooks/use-page-operations";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageFavoriteControl = observer(function PageFavoriteControl({ page }: Props) {
  // derived values
  const { is_favorite, canCurrentUserFavoritePage } = page;
  // page operations
  const { pageOperations } = usePageOperations({
    page,
  });

  if (!canCurrentUserFavoritePage) return null;

  return (
    <IconButton
      variant="ghost"
      size="md"
      icon={<Icon icon={StarOutline} />}
      onClick={() => {
        pageOperations.toggleFavorite();
      }}
      aria-label={is_favorite ? "Remove favorite" : "Add to favorites"}
      render={
        <button
          className={
            is_favorite ? "[&_svg]:fill-(--color-label-yellow-icon) [&_svg]:stroke-(--color-label-yellow-icon)" : ""
          }
        />
      }
    />
  );
});
