import { useContext } from "react";
// plane imports
import { EIssuePropertyType } from "@plane/constants";
import { IIssueProperty } from "@plane/types";
// context
import { StoreContext } from "@/lib/store-context";

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
