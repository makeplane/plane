import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IIssuePropertyOption } from "@/plane-web/store/issue-types";

export const usePropertyOption = (
  typeId: string,
  propertyId: string | null | undefined,
  optionId: string | null | undefined
): IIssuePropertyOption | undefined => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePropertyOption must be used within StoreProvider");
  if (!propertyId || !optionId) {
    console.warn("usePropertyOption: propertyId or optionId is not provided");
    return undefined;
  }
  // get the property
  const issueProperty = context.issueTypes.data?.[typeId]?.getPropertyById(propertyId);
  // get the property option
  const issuePropertyOption = issueProperty?.getPropertyOptionById(optionId);
  if (!issuePropertyOption) {
    console.warn("usePropertyOption: issuePropertyOption is not found");
  }
  return issuePropertyOption;
};
