import React from "react";
import { Tooltip } from "@plane/propel/tooltip";
import type { TBaseLayoutType } from "@plane/types";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { BASE_LAYOUTS } from "./constants";

type Props = {
  layouts?: TBaseLayoutType[];
  onChange: (layout: TBaseLayoutType) => void;
  selectedLayout: TBaseLayoutType;
};

export function LayoutSwitcher(props: Props) {
  const { layouts, onChange, selectedLayout } = props;
  const { isMobile } = usePlatformOS();

  const handleOnChange = (layoutKey: TBaseLayoutType) => {
    if (selectedLayout !== layoutKey) {
      onChange(layoutKey);
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-sm bg-layer-1 p-1">
      {BASE_LAYOUTS.filter((l) => (layouts ? layouts.includes(l.key) : true)).map((layout) => {
        const Icon = layout.icon;
        return (
          <Tooltip key={layout.key} tooltipContent={layout.label} isMobile={isMobile}>
            <button
              type="button"
              className={`group grid h-[22px] w-7 place-items-center overflow-hidden rounded-sm transition-all hover:bg-surface-1 ${
                selectedLayout === layout.key ? "bg-surface-1 shadow-custom-shadow-2xs" : ""
              }`}
              onClick={() => handleOnChange(layout.key)}
            >
              <Icon
                strokeWidth={2}
                className={`h-3.5 w-3.5 ${selectedLayout === layout.key ? "text-primary" : "text-secondary"}`}
              />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
