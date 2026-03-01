/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React, { useState } from "react";
import type { Placement } from "@popperjs/core";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Popover, Transition } from "@headlessui/react";
// plane imports
import { WIDGET_DROPDOWN_SECTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { EWidgetChartModels, EWidgetChartTypes } from "@plane/types";
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

export const DashboardWidgetChartTypesDropdown = observer(function DashboardWidgetChartTypesDropdown(props: Props) {
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
          "w-full h-7 flex items-center gap-1 px-2 py-1 rounded-sm hover:bg-layer-1 text-left cursor-pointer transition-colors",
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
            <div className="my-1 max-h-[90vh] overflow-y-scroll rounded-md border-[0.5px] border-subtle-1 bg-surface-1 p-4 text-11 shadow-raised-200 focus:outline-none min-w-64 whitespace-nowrap divide-y divide-strong">
              {WIDGET_DROPDOWN_SECTIONS.map((section, index) => (
                <div
                  key={section.key}
                  className={cn("space-y-2 py-4", {
                    "pt-0": index === 0,
                    "pb-0": index === WIDGET_DROPDOWN_SECTIONS.length - 1,
                  })}
                >
                  <h6 className="text-13 font-semibold text-primary">{t(section.i18n_label)}</h6>
                  {section.widgets.map((widget) => (
                    <div key={widget.key} className="space-y-1">
                      <p className="text-13 font-semibold text-tertiary">{t(widget.i18n_label)}</p>
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
