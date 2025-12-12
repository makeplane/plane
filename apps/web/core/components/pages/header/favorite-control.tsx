import { observer } from "mobx-react";
import { Star } from "lucide-react";
// constants
import { PROJECT_PAGE_TRACKER_ELEMENTS } from "@plane/constants";
// ui
import { IconButton } from "@plane/propel/icon-button";
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";
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
      size="lg"
      icon={Star}
      onClick={() => {
        captureClick({
          elementName: PROJECT_PAGE_TRACKER_ELEMENTS.FAVORITE_BUTTON,
        });
        pageOperations.toggleFavorite();
      }}
      aria-label={is_favorite ? "Remove favorite" : "Add to favorites"}
      className={is_favorite ? "*:fill-(--color-label-yellow-icon) *:stroke-(--color-label-yellow-icon)" : ""}
    />
  );
});
