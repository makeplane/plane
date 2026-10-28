/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext, useContext } from "react";

export type TDateFilterModalRequest = {
  /** Modal heading — the date property being filtered. */
  title: string;
  /** Receives the custom range the user picked, e.g. `["2026-01-01;after", "2026-02-01;before"]`. */
  onSelect: (value: string[]) => void;
};

type TDateFilterModalContext = {
  openDateFilterModal: (request: TDateFilterModalRequest) => void;
};

export const DateFilterModalContext = createContext<TDateFilterModalContext | null>(null);

/**
 * The custom-range opener of the nearest `DateFilterModalHost`, or `null` when the menu has none — a
 * date submenu then simply offers no "Custom" row.
 */
export const useDateFilterModal = () => useContext(DateFilterModalContext);
