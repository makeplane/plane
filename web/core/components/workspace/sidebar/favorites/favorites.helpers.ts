import orderBy from "lodash/orderBy";
import { IFavorite } from "@plane/types";

export const getDestinationStateSequence = (
  favoriteMap: Record<string, IFavorite>,
  destinationId: string,
  edge: string | undefined
) => {
  const defaultSequence = 65535;
  if (!edge) return defaultSequence;

  const favoriteIds = orderBy(Object.values(favoriteMap), "sequence", "desc")
    .filter((fav: IFavorite) => !fav.parent)
    .map((fav: IFavorite) => fav.id);
  const destinationStateIndex = favoriteIds.findIndex((id) => id === destinationId);
  const destinationStateSequence = favoriteMap[destinationId]?.sequence || undefined;

  if (!destinationStateSequence) return defaultSequence;

  if (edge === "top") {
    const prevStateSequence = favoriteMap[favoriteIds[destinationStateIndex - 1]]?.sequence || undefined;

    if (prevStateSequence === undefined) {
      return destinationStateSequence + defaultSequence;
    }
    return (destinationStateSequence + prevStateSequence) / 2;
  } else if (edge === "bottom") {
    const nextStateSequence = favoriteMap[favoriteIds[destinationStateIndex + 1]]?.sequence || undefined;

    if (nextStateSequence === undefined) {
      return destinationStateSequence - defaultSequence;
    }
    return (destinationStateSequence + nextStateSequence) / 2;
  }
};
