import React, { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { ListFilterPlus } from "lucide-react";
import { Transition } from "@headlessui/react";
// plane imports
import { Button } from "@plane/propel/button";
import { IFilterInstance } from "@plane/shared-state";
import { TExternalFilter, TFilterProperty } from "@plane/types";
import { cn, EHeaderVariant, Header, Loader } from "@plane/ui";
// local imports
import { AddFilterButton, TAddFilterButtonProps } from "./add-filters-button";
import { FilterItem } from "./filter-item/root";

export type TFiltersRowProps<K extends TFilterProperty, E extends TExternalFilter> = {
  buttonConfig?: TAddFilterButtonProps<K, E>["buttonConfig"];
  disabledAllOperations?: boolean;
  filter: IFilterInstance<K, E>;
  variant?: "modal" | "header";
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
      disabledAllOperations: disabledAllOperationsProp = false,
      filter,
      variant = "header",
      trackerElements,
    } = props;
    // states
    const [isUpdating, setIsUpdating] = useState(false);
    // derived values
    const disabledAllOperations = disabledAllOperationsProp || !filter.configManager.areConfigsReady;
    const hasAnyConditions = filter.allConditionsForDisplay.length > 0;
    const hasAvailableOperations =
      !disabledAllOperations && (filter.canClearFilters || filter.canSaveView || filter.canUpdateView);

    const headerButtonConfig: Partial<TAddFilterButtonProps<K, E>["buttonConfig"]> = {
      variant: "link-neutral",
      className: "bg-custom-background-90",
      label: null,
    };

    const modalButtonConfig: Partial<TAddFilterButtonProps<K, E>["buttonConfig"]> = {
      variant: "neutral-primary",
      className: "bg-custom-background-100",
      label: !hasAnyConditions ? "Filters" : null,
    };

    const handleUpdate = useCallback(async () => {
      setIsUpdating(true);
      try {
        await filter.updateView();
      } finally {
        setTimeout(() => setIsUpdating(false), 240); // To avoid flickering
      }
    }, [filter]);

    const leftContent = (
      <>
        {filter.allConditionsForDisplay.map((condition) => (
          <FilterItem key={condition.id} filter={filter} condition={condition} isDisabled={disabledAllOperations} />
        ))}
        <AddFilterButton
          filter={filter}
          buttonConfig={{
            label: null,
            ...(variant === "modal" ? modalButtonConfig : headerButtonConfig),
            iconConfig: {
              shouldShowIcon: true,
              iconComponent: ListFilterPlus,
            },
            ...buttonConfig,
            isDisabled: disabledAllOperations,
          }}
        />
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

    const mainContent = (
      <div className="w-full flex items-start gap-2">
        <div className="w-full flex flex-wrap items-center gap-2">{leftContent}</div>
        <div
          className={cn("flex items-center gap-2 border-l border-custom-border-200 pl-4", {
            "border-l-transparent pl-0": !hasAvailableOperations,
          })}
        >
          {rightContent}
        </div>
      </div>
    );

    const ModalVariant = (
      <div className="w-full flex flex-wrap items-center gap-2 min-h-11 bg-custom-background-90 rounded-lg p-2">
        {mainContent}
      </div>
    );

    const HeaderVariant = (
      <Header variant={EHeaderVariant.TERNARY} className="min-h-11">
        {mainContent}
      </Header>
    );

    if (!filter.configManager.areConfigsReady && !hasAnyConditions) {
      return (
        <RowTransition show={filter.isVisible}>
          <Loader>
            <Loader.Item height="44px" width="100%" className={cn({ "rounded-none": variant === "header" })} />
          </Loader>
        </RowTransition>
      );
    }

    return <RowTransition show={filter.isVisible}>{variant === "modal" ? ModalVariant : HeaderVariant}</RowTransition>;
  }
);

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

type TRowTransitionProps = {
  children: React.ReactNode;
  show: boolean;
};

const RowTransition = observer((props: TRowTransitionProps) => (
  <Transition
    show={props.show}
    enter="transition-all duration-150 ease-out"
    enterFrom="opacity-0 -translate-y-1"
    enterTo="opacity-100 translate-y-0"
    leave="transition-all duration-100 ease-in"
    leaveFrom="opacity-100 translate-y-0"
    leaveTo="opacity-0 -translate-y-1"
  >
    {props.children}
  </Transition>
));
