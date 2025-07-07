import { observer } from "mobx-react";
// constants
import { PROJECT_PAGE_TRACKER_ELEMENTS } from "@plane/constants";
// ui
import { FavoriteStar } from "@plane/ui";
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { usePageOperations } from "@/hooks/use-page-operations";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageFavoriteControl = observer(({ page }: Props) => {
  // derived values
  const { is_favorite, canCurrentUserFavoritePage } = page;
  // page operations
  const { pageOperations } = usePageOperations({
    page,
  });

  if (!canCurrentUserFavoritePage) return null;

  return (
    <FavoriteStar
      selected={is_favorite}
      onClick={() => {
        captureClick({
          elementName: PROJECT_PAGE_TRACKER_ELEMENTS.FAVORITE_BUTTON,
        });
        pageOperations.toggleFavorite();
      }}
      buttonClassName="flex-shrink-0 size-6 group rounded hover:bg-custom-background-80 transition-colors"
      iconClassName="size-3.5 text-custom-text-200 group-hover:text-custom-text-10"
    />
  );
});
