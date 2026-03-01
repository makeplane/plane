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

import { observer } from "mobx-react";
import { cn } from "@plane/utils";
import { SidebarItem } from "./sidebar-item";
import type { RunnerScript } from "@plane/types";
import { Loader } from "@plane/ui";
import { Plus } from "lucide-react";

export const ScriptModalSidebar = observer(function ScriptModalSidebar(props: {
  activeScriptId: string | null;
  scripts: RunnerScript[] | undefined;
  isLoading: boolean;
  allowCreation?: boolean;
  onClickItem: (scriptId: string | null) => void;
}) {
  const { activeScriptId, scripts, isLoading, onClickItem, allowCreation = true } = props;
  return (
    <div className="p-5 flex flex-col gap-3 ">
      <div className="text-body-md-medium text-primary text-start">Scripts</div>
      {allowCreation && (
        <button
          type="button"
          className={cn(
            "flex items-center px-2 text-tertiary justify-between gap-2 h-8 w-full rounded-md shadow-raised-100 border border-strong transition-[width] ease-linear overflow-hidden disabled:bg-pi-100 disabled:border disabled:border-subtle-1 disabled:!text-tertiary"
          )}
          onClick={() => onClickItem(null)}
        >
          <span className="text-body-sm-medium text-secondary text-nowrap">New Script</span>
          <Plus className="size-4 text-icon-secondary" />
        </button>
      )}
      {isLoading ? (
        <div className="flex flex-col gap-2 w-full">
          <Loader.Item height="28px" width="100%" />
          <Loader.Item height="28px" width="100%" />
          <Loader.Item height="28px" width="100%" />
          <Loader.Item height="28px" width="100%" />
        </div>
      ) : (
        <div className="flex flex-col gap-1  w-full border-t border-subtle py-3 overflow-y-auto h-full">
          <div className="text-body-xs-semibold text-placeholder text-start">Saved </div>
          {scripts &&
            scripts.length > 0 &&
            scripts.map((script) => (
              <SidebarItem
                key={script.id}
                title={script.name}
                onClickItem={() => onClickItem(script.id)}
                isActive={activeScriptId === script.id}
              />
            ))}
        </div>
      )}
    </div>
  );
});
