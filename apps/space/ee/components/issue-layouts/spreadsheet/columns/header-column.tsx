"use client";

//ui
import { IIssueDisplayProperties } from "@plane/types";
import { SPREADSHEET_PROPERTY_DETAILS } from "..";
//hooks
//types
//constants

interface Props {
  property: keyof IIssueDisplayProperties;
}

export const HeaderColumn = (props: Props) => {
  const { property } = props;

  const propertyDetails = SPREADSHEET_PROPERTY_DETAILS[property];

  if (!propertyDetails) return <></>;

  return (
    <div className="flex w-full items-center justify-between gap-1.5 py-2 text-sm text-custom-text-200 hover:text-custom-text-100">
      <div className="flex items-center gap-1.5">
        {<propertyDetails.icon className="h-4 w-4 text-custom-text-400" />}
        {propertyDetails.title}
      </div>
    </div>
  );
};
