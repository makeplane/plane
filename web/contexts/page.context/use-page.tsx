import { useContext } from "react";
import { PageContext } from "./page-provider";

export const usePage = () => {
  const context = useContext(PageContext);
  if (context === undefined) throw new Error("useAppRoot must be used within AppRootStoreContext");
  return context;
};
