"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { ListFilter, SlidersHorizontal } from "lucide-react";
import { cn } from "@plane/ui";
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters/header/helpers/dropdown";
import { FilterHeader } from "@/components/issues/issue-layouts/filters/header/helpers/filter-header";
import { FilterOption } from "@/components/issues/issue-layouts/filters/header/helpers/filter-option";
import { useRoster } from "../store/roster-context";
import {
  ALL_CLASS_YEAR_OPTION,
  ALL_POSITION_OPTION,
  ALL_STATUS_OPTION,
  GROUP_BY_OPTIONS,
  ORDER_BY_OPTIONS,
  ROSTER_DISPLAY_PROPERTIES,
} from "../constants/roster.constants";
import { toDisplayStatus } from "../utils/roster.utils";

type TRosterDropdownProps = {
  title?: string;
  icon?: ReactNode;
  miniIcon?: ReactNode;
  menuButton?: ReactNode;
};

export const RosterDisplayDropdown = observer((props: TRosterDropdownProps) => {
  const { title = "Display", icon, miniIcon, menuButton } = props;
  const { displayProperties, toggleDisplayProperty, groupBy, subGroupBy, orderBy, setGroupBy, setSubGroupBy, setOrderBy } =
    useRoster();
  const [showProperties, setShowProperties] = useState(true);
  const [showGroupBy, setShowGroupBy] = useState(true);
  const [showSubGroupBy, setShowSubGroupBy] = useState(true);
  const [showOrderBy, setShowOrderBy] = useState(true);

  return (
    <FiltersDropdown
      icon={icon}
      miniIcon={miniIcon ?? <SlidersHorizontal className="size-3.5" />}
      menuButton={menuButton}
      title={title}
      placement="bottom-end"
    >
      <div className="vertical-scrollbar scrollbar-sm relative h-full w-full divide-y divide-custom-border-200 overflow-hidden overflow-y-auto px-2.5">
        <div className="py-2">
          <FilterHeader
            title="Display Properties"
            isPreviewEnabled={showProperties}
            handleIsPreviewEnabled={() => setShowProperties((state) => !state)}
          />
          {showProperties ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {ROSTER_DISPLAY_PROPERTIES.map((property) => (
                <button
                  key={property.key}
                  type="button"
                  className={cn(
                    "rounded border px-2 py-0.5 text-xs transition-all",
                    displayProperties[property.key]
                      ? "border-custom-primary-100 bg-custom-primary-100 text-white"
                      : "border-custom-border-200 text-custom-text-200 hover:bg-custom-background-80"
                  )}
                  onClick={() => toggleDisplayProperty(property.key)}
                >
                  {property.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="py-2">
          <FilterHeader
            title="Group by"
            isPreviewEnabled={showGroupBy}
            handleIsPreviewEnabled={() => setShowGroupBy((state) => !state)}
          />
          {showGroupBy ? (
            <div>
              {GROUP_BY_OPTIONS.map((option) => (
                <FilterOption
                  key={option.key}
                  isChecked={groupBy === option.key}
                  onClick={() => setGroupBy(option.key)}
                  title={option.label}
                  multiple={false}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="py-2">
          <FilterHeader
            title="Sub-group by"
            isPreviewEnabled={showSubGroupBy}
            handleIsPreviewEnabled={() => setShowSubGroupBy((state) => !state)}
          />
          {showSubGroupBy ? (
            <div>
              {GROUP_BY_OPTIONS.map((option) => (
                <FilterOption
                  key={option.key}
                  isChecked={subGroupBy === option.key}
                  onClick={() => setSubGroupBy(option.key)}
                  title={option.label}
                  multiple={false}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="py-2">
          <FilterHeader
            title="Order by"
            isPreviewEnabled={showOrderBy}
            handleIsPreviewEnabled={() => setShowOrderBy((state) => !state)}
          />
          {showOrderBy ? (
            <div>
              {ORDER_BY_OPTIONS.map((option) => (
                <FilterOption
                  key={option.key}
                  isChecked={orderBy === option.key}
                  onClick={() => setOrderBy(option.key)}
                  title={option.label}
                  multiple={false}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </FiltersDropdown>
  );
});

export const RosterFilterDropdown = observer((props: TRosterDropdownProps) => {
  const { title = "Filter", icon, miniIcon, menuButton } = props;
  const {
    statusOptions,
    positionOptions,
    classYearOptions,
    selectedPosition,
    setSelectedPosition,
    selectedStatus,
    setSelectedStatus,
    selectedClassYear,
    setSelectedClassYear,
  } = useRoster();
  const [showStatus, setShowStatus] = useState(true);
  const [showPosition, setShowPosition] = useState(true);
  const [showClassYear, setShowClassYear] = useState(true);

  return (
    <FiltersDropdown
      icon={icon ?? <ListFilter className="size-3.5" />}
      miniIcon={miniIcon ?? <ListFilter className="size-3.5" />}
      menuButton={menuButton}
      title={title}
      placement="bottom-end"
      isFiltersApplied={!!selectedPosition || !!selectedStatus || !!selectedClassYear}
    >
      <div className="vertical-scrollbar scrollbar-sm relative h-full w-full divide-y divide-custom-border-200 overflow-hidden overflow-y-auto px-2.5">
        <div className="py-2">
          <FilterHeader
            title="Status"
            isPreviewEnabled={showStatus}
            handleIsPreviewEnabled={() => setShowStatus((state) => !state)}
          />
          {showStatus ? (
            <div>
              <FilterOption
                isChecked={selectedStatus === ""}
                onClick={() => setSelectedStatus("")}
                title={ALL_STATUS_OPTION}
                multiple={false}
              />
              {statusOptions.map((option) => (
                <FilterOption
                  key={option}
                  isChecked={selectedStatus === option}
                  onClick={() => setSelectedStatus(option)}
                  title={toDisplayStatus(option)}
                  multiple={false}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="py-2">
          <FilterHeader
            title="Position"
            isPreviewEnabled={showPosition}
            handleIsPreviewEnabled={() => setShowPosition((state) => !state)}
          />
          {showPosition ? (
            <div>
              <FilterOption
                isChecked={selectedPosition === ""}
                onClick={() => setSelectedPosition("")}
                title={ALL_POSITION_OPTION}
                multiple={false}
              />
              {positionOptions.map((option) => (
                <FilterOption
                  key={option}
                  isChecked={selectedPosition === option}
                  onClick={() => setSelectedPosition(option)}
                  title={option}
                  multiple={false}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="py-2">
          <FilterHeader
            title="Class/Year"
            isPreviewEnabled={showClassYear}
            handleIsPreviewEnabled={() => setShowClassYear((state) => !state)}
          />
          {showClassYear ? (
            <div>
              <FilterOption
                isChecked={selectedClassYear === ""}
                onClick={() => setSelectedClassYear("")}
                title={ALL_CLASS_YEAR_OPTION}
                multiple={false}
              />
              {classYearOptions.map((option) => (
                <FilterOption
                  key={option}
                  isChecked={selectedClassYear === option}
                  onClick={() => setSelectedClassYear(option)}
                  title={option}
                  multiple={false}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </FiltersDropdown>
  );
});
