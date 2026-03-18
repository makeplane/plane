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

import type { ReactNode } from "react";
import { AddIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { Badge } from "@plane/propel/badge";
import { IconButton } from "@plane/propel/icon-button";
import { Pill, EPillSize, EPillVariant, ERadius } from "@plane/propel/pill";
import { cn } from "@plane/utils";
import { ChevronDown, MoreHorizontal } from "lucide-react";

type HierarchyPill = {
  id: string;
  label: string;
  icon?: ReactNode;
};

type HierarchyLevel = {
  id: string;
  title: string;
  badgeCount: number;
  badgeLabel?: string;
  icon?: ReactNode;
  description?: string;
  pills?: HierarchyPill[];
};

type Props = {
  levels: HierarchyLevel[];
  addLabel?: string;
  onAddLevel?: () => void;
  onMenuClick?: (levelId: string) => void;
  className?: string;
};

export function WorkspaceHierarchyLevels(props: Props) {
  const { levels, addLabel = "Add hierarchy level", onAddLevel, onMenuClick, className } = props;

  return (
    <div className={cn("bg-surface-2 rounded-2xl p-4", className)}>
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Button
            type="button"
            variant="secondary"
            size="xl"
            className="w-full justify-start gap-2 bg-layer-1 border border-subtle-1 text-secondary"
            onClick={onAddLevel}
            disabled={!onAddLevel}
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-layer-2 border border-subtle-1">
              <AddIcon className="size-4 text-tertiary" />
            </span>
            <span className="text-body-sm-medium">{addLabel}</span>
          </Button>
        </div>

        {levels.map((level, index) => (
          <div key={level.id} className="flex flex-col gap-4">
            <div className="relative">
              {index === 0 ? (
                <div className="absolute left-6 -top-4 flex h-4 items-center">
                  <ChevronDown className="size-4 text-tertiary" />
                </div>
              ) : (
                <div className="absolute left-6 -top-6 flex h-6 items-center">
                  <ChevronDown className="size-4 text-tertiary" />
                </div>
              )}
              {index !== 0 && <div className="absolute left-6 -top-6 h-6 w-px bg-subtle-1" />}
              <div className="flex items-center justify-between rounded-lg border border-subtle-1 bg-layer-2 p-3">
                <div className="flex items-center gap-3">
                  <Badge size="lg" variant="neutral">
                    {level.badgeCount}
                  </Badge>
                  <div
                    className="flex size-8 items-center justify-center rounded-md bg-[var(--extended-color-pink-100)]"
                    aria-hidden
                  >
                    {level.icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm-medium text-primary">{level.title}</span>
                      {level.badgeLabel ? (
                        <Badge size="sm" variant="warning">
                          {level.badgeLabel}
                        </Badge>
                      ) : null}
                    </div>
                    {level.description ? (
                      <span className="text-body-xs-regular text-secondary">{level.description}</span>
                    ) : null}
                  </div>
                </div>
                <IconButton
                  type="button"
                  variant="secondary"
                  size="base"
                  icon={MoreHorizontal}
                  aria-label="Open level menu"
                  onClick={() => onMenuClick?.(level.id)}
                />
              </div>
            </div>

            {level.pills && level.pills.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 pl-11">
                {level.pills.map((pill) => (
                  <Pill
                    key={pill.id}
                    size={EPillSize.XS}
                    variant={EPillVariant.DEFAULT}
                    radius={ERadius.SQUARE}
                    className="border-subtle-1 text-tertiary gap-1.5"
                  >
                    {pill.icon ? (
                      <span className="flex size-4 items-center justify-center rounded-sm bg-layer-2 text-tertiary">
                        {pill.icon}
                      </span>
                    ) : null}
                    <span className="text-caption-md-regular">{pill.label}</span>
                  </Pill>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
