import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
import type { IFavoriteStore } from "@/store/favorite.store";

export const useFavorite = (): IFavoriteStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useFavorites must be used within StoreProvider");
  return context.favorite;
};
