import React, { useState } from "react";
import { Placement } from "@popperjs/core";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Popover, Transition } from "@headlessui/react";
// plane imports
import {  WIDGET_DROPDOWN_SECTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EWidgetChartModels, EWidgetChartTypes } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { DashboardWidgetChartTypesDropdownOption } from "./option";

type Props = {
  buttonClassName?: string;
  buttonContent: React.ReactNode;
  disabled?: boolean;
  onSelect: ({ chartType, chartModel }: { chartType: EWidgetChartTypes; chartModel: EWidgetChartModels }) => void;
  placement?: Placement;
  selectedChartModel?: EWidgetChartModels | undefined;
  selectedChartType?: EWidgetChartTypes | undefined;
};

export const DashboardWidgetChartTypesDropdown: React.FC<Props> = observer((props) => {
  const {
    buttonClassName,
    buttonContent,
    disabled = false,
    onSelect,
    placement,
    selectedChartModel,
    selectedChartType,
  } = props;
  // states
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // react-popper
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
  });
  // translation
  const { t } = useTranslation();

  return (
    <Popover className="relative flex-shrink-0 text-left">
      <Popover.Button
        as="button"
        type="button"
        ref={setReferenceElement}
        className={cn(
          "w-full h-7 flex items-center gap-1 px-2 py-1 rounded hover:bg-custom-background-80 text-left cursor-pointer transition-colors",
          buttonClassName
        )}
        disabled={disabled}
      >
        {buttonContent}
      </Popover.Button>
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel ref={setPopperElement} style={styles.popper} {...attributes.popper} className="fixed z-10">
          {({ close }) => (
            <div className="my-1 max-h-[90vh] overflow-y-scroll rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 p-4 text-xs shadow-custom-shadow-rg focus:outline-none min-w-64 whitespace-nowrap divide-y divide-custom-border-300">
              {WIDGET_DROPDOWN_SECTIONS.map((section, index) => (
                <div
                  key={section.key}
                  className={cn("space-y-2 py-4", {
                    "pt-0": index === 0,
                    "pb-0": index === WIDGET_DROPDOWN_SECTIONS.length - 1,
                  })}
                >
                  <h6 className="text-sm font-semibold text-custom-text-100">{t(section.i18n_label)}</h6>
                  {section.widgets.map((widget) => (
                    <div key={widget.key} className="space-y-1">
                      <p className="text-sm font-semibold text-custom-text-300">{t(widget.i18n_label)}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {widget.models.map((model) => (
                          <DashboardWidgetChartTypesDropdownOption
                            key={model.value}
                            isSelected={selectedChartType === widget.key && selectedChartModel === model.value}
                            model={model}
                            onSelect={(val) => {
                              onSelect({
                                chartType: widget.key,
                                chartModel: val,
                              });
                              close();
                            }}
                            widget={widget.key}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
});
