import { observer } from "mobx-react";
// plane imports
import { FavoriteStar } from "@plane/ui";
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
      onClick={pageOperations.toggleFavorite}
      buttonClassName="flex-shrink-0 size-6 group rounded hover:bg-custom-background-80 transition-colors"
      iconClassName="size-3.5 text-custom-text-200 group-hover:text-custom-text-10"
    />
  );
});
