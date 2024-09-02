import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IIssueProperty } from "@/plane-web/store/issue-types";
// plane web types
import { EIssuePropertyType } from "@/plane-web/types";

export const useIssueProperty = <T extends EIssuePropertyType>(
  typeId: string,
  propertyId: string | null | undefined
): IIssueProperty<T> | undefined => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssueProperty must be used within StoreProvider");
  if (!propertyId) {
    return undefined;
  }
  const issueProperty = context.issueTypes.data?.[typeId]?.getPropertyById<T>(propertyId);
  return issueProperty;
};
