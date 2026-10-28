/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
// components
import { DateFilterModal } from "@/components/core/filters/date-filter-modal";
// local imports
import type { TDateFilterModalRequest } from "./date-filter-modal-context";
import { DateFilterModalContext } from "./date-filter-modal-context";

/**
 * Renders the custom date-range modal for the date submenus of a filters menu.
 *
 * Menu popups unmount as soon as the menu closes, so a modal rendered from a submenu row would be
 * torn down with it. This host wraps the whole `Menu` instead and the rows only ask it to open.
 */
export function DateFilterModalHost({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<TDateFilterModalRequest | null>(null);

  const openDateFilterModal = useCallback((nextRequest: TDateFilterModalRequest) => setRequest(nextRequest), []);
  const contextValue = useMemo(() => ({ openDateFilterModal }), [openDateFilterModal]);

  return (
    <DateFilterModalContext.Provider value={contextValue}>
      {children}
      {request && (
        <DateFilterModal
          isOpen
          title={request.title}
          handleClose={() => setRequest(null)}
          onSelect={(value) => request.onSelect(value)}
        />
      )}
    </DateFilterModalContext.Provider>
  );
}
