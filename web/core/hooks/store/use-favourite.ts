import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
import { IFavouriteStore } from "@/store/favourite.store";

export const useFavourite = (): IFavouriteStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useFavourites must be used within StoreProvider");
  return context.favourite;
};
