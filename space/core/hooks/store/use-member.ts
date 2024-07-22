import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import { IIssueMemberStore } from "@/store/members.store";

export const useMember = (): IIssueMemberStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useMember must be used within StoreProvider");
  return context.member;
};
