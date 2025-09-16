import React, { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Transition } from "@headlessui/react";
// plane imports
import { IFilterInstance } from "@plane/shared-state";
import { TExternalFilter, TFilterProperty } from "@plane/types";
import { Button, EHeaderVariant, Header } from "@plane/ui";
// local imports
import { AddFilterButton, TAddFilterButtonProps } from "./add-filters-button";
import { FilterItem } from "./filter-item";

export type TFiltersRowProps<K extends TFilterProperty, E extends TExternalFilter> = {
  buttonConfig?: TAddFilterButtonProps<K, E>["buttonConfig"];
  disabledAllOperations?: boolean;
  filter: IFilterInstance<K, E>;
  variant?: "default" | "header";
  visible?: boolean;
  maxVisibleConditions?: number;
  trackerElements?: {
    clearFilter?: string;
    saveView?: string;
    updateView?: string;
  };
};

export const FiltersRow = observer(
  <K extends TFilterProperty, E extends TExternalFilter>(props: TFiltersRowProps<K, E>) => {
    const {
      buttonConfig,
      disabledAllOperations = false,
      filter,
      variant = "header",
      visible = true,
      maxVisibleConditions = 3,
      trackerElements,
    } = props;
    // states
    const [showAllConditions, setShowAllConditions] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    // derived values
    const visibleConditions = useMemo(() => {
      if (variant === "default" || !maxVisibleConditions || showAllConditions) {
        return filter.allConditionsForDisplay;
      }
      return filter.allConditionsForDisplay.slice(0, maxVisibleConditions);
    }, [filter.allConditionsForDisplay, maxVisibleConditions, showAllConditions, variant]);
    const hiddenConditionsCount = useMemo(() => {
      if (variant === "default" || !maxVisibleConditions || showAllConditions) {
        return 0;
      }
      return Math.max(0, filter.allConditionsForDisplay.length - maxVisibleConditions);
    }, [filter.allConditionsForDisplay.length, maxVisibleConditions, showAllConditions, variant]);

    const handleUpdate = useCallback(async () => {
      setIsUpdating(true);
      await filter.updateView();
      setTimeout(() => setIsUpdating(false), 240); // To avoid flickering
    }, [filter]);

    if (!visible) return null;

    const leftContent = (
      <>
        <AddFilterButton
          filter={filter}
          buttonConfig={{
            ...buttonConfig,
            isDisabled: disabledAllOperations,
          }}
          onFilterSelect={() => {
            if (variant === "header") {
              setShowAllConditions(true);
            }
          }}
        />
        {visibleConditions.map((condition) => (
          <FilterItem key={condition.id} filter={filter} condition={condition} isDisabled={disabledAllOperations} />
        ))}
        {variant === "header" && hiddenConditionsCount > 0 && (
          <Button
            variant="neutral-primary"
            size="sm"
            className={COMMON_VISIBILITY_BUTTON_CLASSNAME}
            onClick={() => setShowAllConditions(true)}
          >
            +{hiddenConditionsCount} more
          </Button>
        )}
        {variant === "header" &&
          showAllConditions &&
          maxVisibleConditions &&
          filter.allConditionsForDisplay.length > maxVisibleConditions && (
            <Button
              variant="neutral-primary"
              size="sm"
              className={COMMON_VISIBILITY_BUTTON_CLASSNAME}
              onClick={() => setShowAllConditions(false)}
            >
              Show less
            </Button>
          )}
      </>
    );

    const rightContent = !disabledAllOperations && (
      <>
        <ElementTransition show={filter.canClearFilters}>
          <Button
            variant="neutral-primary"
            size="sm"
            className={COMMON_OPERATION_BUTTON_CLASSNAME}
            onClick={filter.clearFilters}
            data-ph-element={trackerElements?.clearFilter}
          >
            {filter.clearFilterOptions?.label ?? "Clear all"}
          </Button>
        </ElementTransition>
        <ElementTransition show={filter.canSaveView}>
          <Button
            variant="accent-primary"
            size="sm"
            className={COMMON_OPERATION_BUTTON_CLASSNAME}
            onClick={filter.saveView}
            data-ph-element={trackerElements?.saveView}
          >
            {filter.saveViewOptions?.label ?? "Save view"}
          </Button>
        </ElementTransition>
        <ElementTransition show={filter.canUpdateView}>
          <Button
            variant="accent-primary"
            size="sm"
            className={COMMON_OPERATION_BUTTON_CLASSNAME}
            onClick={handleUpdate}
            loading={isUpdating}
            disabled={isUpdating}
            data-ph-element={trackerElements?.updateView}
          >
            {isUpdating ? "Confirming" : (filter.updateViewOptions?.label ?? "Update view")}
          </Button>
        </ElementTransition>
      </>
    );

    if (variant === "default") {
      return (
        <div className="w-full flex flex-wrap items-center gap-2">
          {leftContent}
          {rightContent}
        </div>
      );
    }

    return (
      <Header variant={EHeaderVariant.TERNARY}>
        <div className="w-full flex items-start gap-2">
          <div className="w-full flex flex-wrap items-center gap-2">{leftContent}</div>
          <div className="flex items-center gap-2">{rightContent}</div>
        </div>
      </Header>
    );
  }
);

const COMMON_VISIBILITY_BUTTON_CLASSNAME = "py-0.5 px-2 text-custom-text-300 hover:text-custom-text-100 rounded-full";
const COMMON_OPERATION_BUTTON_CLASSNAME = "py-1";

type TElementTransitionProps = {
  children: React.ReactNode;
  show: boolean;
};

const ElementTransition = observer((props: TElementTransitionProps) => (
  <Transition
    show={props.show}
    enter="transition ease-out duration-200"
    enterFrom="opacity-0 scale-95"
    enterTo="opacity-100 scale-100"
    leave="transition ease-in duration-150"
    leaveFrom="opacity-100 scale-100"
    leaveTo="opacity-0 scale-95"
  >
    {props.children}
  </Transition>
));
