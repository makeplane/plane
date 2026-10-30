/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import React from "react";

type TSingleProgressStatsProps = {
  title: any;
  completed: number;
  total: number;
  onClick?: () => void;
  selected?: boolean;
};

export function SingleProgressStats({ title, completed, total, onClick, selected = false }: TSingleProgressStatsProps) {
  const { t } = useTranslation();

  const Container = onClick ? "button" : "div";

  return (
    <Container
      type={onClick ? "button" : undefined}
      className={`flex w-full items-center justify-between gap-4 rounded-xs p-1 text-left text-11 ${
        onClick ? "cursor-pointer hover:bg-surface-2" : ""
      } ${selected ? "bg-layer-1" : ""}`}
      onClick={onClick}
    >
      <div className="w-4/6">{title}</div>
      <div className="flex w-2/6 items-center justify-end gap-1 px-2">
        <div className="flex h-5 items-center justify-center gap-1">
          <span className="w-8 text-right">
            {isNaN(Math.round((completed / total) * 100)) ? "0" : Math.round((completed / total) * 100)}%
          </span>
        </div>
        <span>
          {t("web_ui.of")} {total}
        </span>
      </div>
    </Container>
  );
}
