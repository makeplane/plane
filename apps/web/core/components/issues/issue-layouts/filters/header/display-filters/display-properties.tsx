/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { observer } from "mobx-react";
// plane constants
import { ISSUE_DISPLAY_PROPERTIES, SPREADSHEET_PROPERTY_LIST } from "@plane/constants";
// plane i18n
import { useTranslation } from "@plane/i18n";
// types
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
// components
import { FilterHeader } from "../helpers/filter-header";

type TSpreadsheetDisplayFilters = IIssueDisplayFilterOptions & {
  spreadsheet_columns?: (keyof IIssueDisplayProperties)[];
};

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayFilters?: TSpreadsheetDisplayFilters;
  displayPropertiesToRender: (keyof IIssueDisplayProperties)[];
  handleUpdate: (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => void;
  handleDisplayFiltersUpdate?: (updatedDisplayFilter: Partial<TSpreadsheetDisplayFilters>) => void;
  cycleViewDisabled?: boolean;
  moduleViewDisabled?: boolean;
  isEpic?: boolean;
};

const TIMESTAMP_DISPLAY_PROPERTIES: {
  key: keyof IIssueDisplayProperties;
  titleTranslationKey: string;
}[] = [
  { key: "created_on", titleTranslationKey: "common.sort.created_on" },
  { key: "updated_on", titleTranslationKey: "common.sort.updated_on" },
];

const DISPLAY_PROPERTIES_OPTIONS = [
  ...ISSUE_DISPLAY_PROPERTIES,
  ...TIMESTAMP_DISPLAY_PROPERTIES.filter(
    (timestampProperty) => !ISSUE_DISPLAY_PROPERTIES.some((property) => property.key === timestampProperty.key)
  ),
];
const DISPLAY_PROPERTIES_BY_KEY = new Map(DISPLAY_PROPERTIES_OPTIONS.map((property) => [property.key, property]));

type TDisplayPropertyOption = (typeof DISPLAY_PROPERTIES_OPTIONS)[number];
type TDisplayPropertyDragData = {
  type: "SPREADSHEET_DISPLAY_PROPERTY";
  propertyKey: keyof IIssueDisplayProperties;
};

const getOrderedDisplayProperties = (
  properties: TDisplayPropertyOption[],
  savedOrder: (keyof IIssueDisplayProperties)[] | undefined
) => {
  if (!savedOrder || savedOrder.length === 0) return properties;

  const propertiesMap = new Map(properties.map((property) => [property.key, property]));
  const orderedProperties = savedOrder
    .map((propertyKey) => propertiesMap.get(propertyKey))
    .filter((property): property is TDisplayPropertyOption => !!property);
  const unorderedProperties = properties.filter((property) => !savedOrder.includes(property.key));

  return [...orderedProperties, ...unorderedProperties];
};

const reorderDisplayProperties = (
  properties: TDisplayPropertyOption[],
  sourceKey: keyof IIssueDisplayProperties,
  destinationKey: keyof IIssueDisplayProperties,
  edge: string | null
) => {
  const sourceIndex = properties.findIndex((property) => property.key === sourceKey);
  const destinationIndex = properties.findIndex((property) => property.key === destinationKey);

  if (sourceIndex === -1 || destinationIndex === -1 || sourceIndex === destinationIndex) return properties;

  const reorderedProperties = [...properties];
  const [movedProperty] = reorderedProperties.splice(sourceIndex, 1);
  const destinationIndexAfterRemoval = reorderedProperties.findIndex((property) => property.key === destinationKey);
  const nextIndex = edge === "right" ? destinationIndexAfterRemoval + 1 : destinationIndexAfterRemoval;

  reorderedProperties.splice(nextIndex, 0, movedProperty);
  return reorderedProperties;
};

type TDisplayPropertyChipProps = {
  displayProperty: TDisplayPropertyOption;
  children: React.ReactNode;
  onMove: (
    sourceKey: keyof IIssueDisplayProperties,
    destinationKey: keyof IIssueDisplayProperties,
    edge: string | null
  ) => void;
};

const DisplayPropertyDraggableChip = (props: TDisplayPropertyChipProps) => {
  const { displayProperty, children, onMove } = props;
  const chipRef = React.useRef<HTMLSpanElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [closestEdge, setClosestEdge] = React.useState<string | null>(null);
  const [isDraggedOver, setIsDraggedOver] = React.useState(false);

  React.useEffect(() => {
    const element = chipRef.current;
    const data: TDisplayPropertyDragData = {
      type: "SPREADSHEET_DISPLAY_PROPERTY",
      propertyKey: displayProperty.key,
    };

    if (!element) return;

    return combine(
      draggable({
        element,
        getInitialData: () => data,
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => {
          const sourceData = source.data as Partial<TDisplayPropertyDragData>;
          return sourceData.type === data.type && sourceData.propertyKey !== data.propertyKey;
        },
        getData: ({ input, element: targetElement }) =>
          attachClosestEdge(data, {
            input,
            element: targetElement,
            allowedEdges: ["left", "right"],
          }),
        onDragEnter: (args) => {
          setIsDraggedOver(true);
          setClosestEdge(extractClosestEdge(args.self.data));
        },
        onDrag: (args) => {
          setClosestEdge(extractClosestEdge(args.self.data));
        },
        onDragLeave: () => {
          setIsDraggedOver(false);
          setClosestEdge(null);
        },
        onDrop: ({ self, source }) => {
          setIsDraggedOver(false);
          setClosestEdge(null);

          const sourceData = source.data as Partial<TDisplayPropertyDragData>;
          const destinationData = self.data as TDisplayPropertyDragData;
          if (!sourceData.propertyKey || sourceData.propertyKey === destinationData.propertyKey) return;

          onMove(sourceData.propertyKey, destinationData.propertyKey, extractClosestEdge(destinationData));
        },
      })
    );
  }, [displayProperty.key, onMove]);

  return (
    <span ref={chipRef} className={`relative inline-flex ${isDragging ? "opacity-50" : ""}`}>
      {isDraggedOver && closestEdge === "left" && (
        <span className="absolute top-0 bottom-0 -left-1 w-0.5 rounded-sm bg-accent-primary" />
      )}
      {children}
      {isDraggedOver && closestEdge === "right" && (
        <span className="absolute top-0 right-[-0.25rem] bottom-0 w-0.5 rounded-sm bg-accent-primary" />
      )}
    </span>
  );
};

export const FilterDisplayProperties = observer(function FilterDisplayProperties(props: Props) {
  const {
    displayProperties,
    displayFilters,
    displayPropertiesToRender,
    handleUpdate,
    handleDisplayFiltersUpdate,
    cycleViewDisabled = false,
    moduleViewDisabled = false,
    isEpic = false,
  } = props;
  // hooks
  const { t } = useTranslation();
  // states
  const [previewEnabled, setPreviewEnabled] = React.useState(true);
  const isSpreadsheetLayout = displayFilters?.layout === EIssueLayoutTypes.SPREADSHEET && !!handleDisplayFiltersUpdate;
  const displayPropertyOptions = (
    isSpreadsheetLayout
      ? (["key", ...SPREADSHEET_PROPERTY_LIST] as (keyof IIssueDisplayProperties)[])
      : DISPLAY_PROPERTIES_OPTIONS.map((property) => property.key)
  )
    .map((propertyKey) => DISPLAY_PROPERTIES_BY_KEY.get(propertyKey))
    .filter((property): property is TDisplayPropertyOption => !!property);

  // Filter out "cycle" and "module" keys if cycleViewDisabled or moduleViewDisabled is true
  // Also filter out display properties that should not be rendered
  const filteredDisplayProperties = displayPropertyOptions
    .filter((property) => {
      if (!displayPropertiesToRender.includes(property.key)) return false;
      switch (property.key) {
        case "cycle":
          return !cycleViewDisabled;
        case "modules":
          return !moduleViewDisabled;
        default:
          return true;
      }
    })
    .map((property) => {
      if (isEpic && property.key === "sub_issue_count") {
        return Object.assign({}, property, { titleTranslationKey: "issue.display.properties.work_item_count" });
      }
      return property;
    });
  const orderedDisplayProperties = getOrderedDisplayProperties(
    filteredDisplayProperties,
    displayFilters?.spreadsheet_columns
  );
  const fixedDisplayProperties = orderedDisplayProperties.filter((property) => property.key === "key");
  const sortableDisplayProperties = orderedDisplayProperties.filter((property) => property.key !== "key");

  const renderDisplayPropertyButton = (displayProperty: TDisplayPropertyOption, isSortable = false) => (
    <button
      key={displayProperty.key}
      type="button"
      className={`rounded-sm border px-2 py-0.5 text-11 transition-all ${
        displayProperties?.[displayProperty.key]
          ? "border-accent-strong bg-accent-primary text-on-color"
          : "border-subtle hover:bg-layer-1"
      } ${isSortable ? "cursor-grab active:cursor-grabbing" : ""}`}
      onClick={() =>
        handleUpdate({
          [displayProperty.key]: !displayProperties?.[displayProperty.key],
        })
      }
    >
      {t(displayProperty.titleTranslationKey)}
    </button>
  );

  const handleColumnOrderChange = React.useCallback(
    (updatedProperties: TDisplayPropertyOption[]) => {
      handleDisplayFiltersUpdate?.({
        spreadsheet_columns: updatedProperties.map((property) => property.key),
      });
    },
    [handleDisplayFiltersUpdate]
  );

  const handleColumnMove = React.useCallback(
    (sourceKey: keyof IIssueDisplayProperties, destinationKey: keyof IIssueDisplayProperties, edge: string | null) => {
      handleColumnOrderChange(reorderDisplayProperties(sortableDisplayProperties, sourceKey, destinationKey, edge));
    },
    [handleColumnOrderChange, sortableDisplayProperties]
  );

  return (
    <>
      <FilterHeader
        title={t("issue.display.properties.label")}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {isSpreadsheetLayout ? (
            <>
              {fixedDisplayProperties.map((displayProperty) => renderDisplayPropertyButton(displayProperty))}
              {sortableDisplayProperties.map((displayProperty) => (
                <DisplayPropertyDraggableChip
                  key={displayProperty.key}
                  displayProperty={displayProperty}
                  onMove={handleColumnMove}
                >
                  {renderDisplayPropertyButton(displayProperty, true)}
                </DisplayPropertyDraggableChip>
              ))}
            </>
          ) : (
            orderedDisplayProperties.map((displayProperty) => renderDisplayPropertyButton(displayProperty))
          )}
        </div>
      )}
    </>
  );
});
