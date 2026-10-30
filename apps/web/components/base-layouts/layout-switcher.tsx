/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { TBaseLayoutType } from "@plane/types";
import { cn } from "@plane/utils";
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
  const { t } = useTranslation();

  const handleOnChange = (layoutKey: TBaseLayoutType) => {
    if (selectedLayout !== layoutKey) {
      onChange(layoutKey);
    }
  };

  return (
    <div className="flex items-center gap-0.25 rounded-lg bg-layer-3 p-0.5">
      {BASE_LAYOUTS.map((layout) => {
        if (layouts && !layouts.includes(layout.key)) return null;
        const Icon = layout.icon;
        const isSelected = selectedLayout === layout.key;
        return (
          <Tooltip key={layout.key} label={t(layout.label)} disabled={isMobile}>
            <button
              type="button"
              aria-label={t(layout.label)}
              aria-pressed={isSelected}
              className={cn(
                "flex h-6 w-7 items-center justify-center overflow-hidden rounded-md border border-transparent text-secondary transition-all hover:bg-layer-transparent-hover hover:text-primary",
                isSelected &&
                  "border-subtle-1 bg-layer-2 text-primary shadow-raised-200 hover:bg-layer-2 hover:text-primary"
              )}
              onClick={() => handleOnChange(layout.key)}
            >
              <Icon className="size-4" />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
