import React from "react";
// components
import { IssueKanBanViewRoot } from "./kanban";
import { LayoutSelection } from "./layout-selection";
import { IssueDropdown } from "./helpers/dropdown";
import { FilterSelection } from "./filters";
import { DisplayFiltersSelection } from "./display-filters";

export const IssuesRoot = () => {
  console.log("issue root");

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden">
      <div className="flex-shrink-0 h-[60px] border-b border-gray-200">
        <div className="w-full h-full p-2 px-5 relative flex justify-between items-center gap-2">
          <div>
            <div>Filter Header</div>
          </div>
          <div className="relative flex items-center gap-2">
            <IssueDropdown title={"Filters"}>
              <FilterSelection />
            </IssueDropdown>
            <IssueDropdown title={"View"}>
              <DisplayFiltersSelection />
            </IssueDropdown>
            <LayoutSelection />
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 border-b border-gray-200">Hello</div>
      <div className="w-full h-full relative overflow-hidden">
        <IssueKanBanViewRoot />
      </div>
    </div>
  );
};
