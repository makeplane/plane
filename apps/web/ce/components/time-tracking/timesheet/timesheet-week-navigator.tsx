/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useCallback } from "react";
import type { FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";

interface TimesheetWeekNavigatorProps {
    weekStart: string | null;
    onWeekChange: (weekStart: string) => void;
    onInit: () => void;
}

/**
 * Week navigator with back/forward arrows and "This Week" button.
 */
export const TimesheetWeekNavigator: FC<TimesheetWeekNavigatorProps> = ({ weekStart, onWeekChange, onInit }) => {
    const { t } = useTranslation();

    // Fetch on mount
    useEffect(() => {
        onInit();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const shiftWeek = useCallback(
        (direction: -1 | 1) => {
            if (!weekStart) return;
            const d = new Date(weekStart);
            d.setDate(d.getDate() + direction * 7);
            onWeekChange(d.toISOString().split("T")[0]);
        },
        [weekStart, onWeekChange]
    );

    const goToThisWeek = useCallback(() => {
        const today = new Date();
        const day = today.getDay();
        // Monday = 1, Sunday = 0 → shift to Monday
        const diff = day === 0 ? -6 : 1 - day;
        today.setDate(today.getDate() + diff);
        onWeekChange(today.toISOString().split("T")[0]);
    }, [onWeekChange]);

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    };

    const weekEnd = weekStart
        ? (() => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + 6);
            return d.toISOString().split("T")[0];
        })()
        : null;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => shiftWeek(-1)} aria-label="Previous week" className="p-1 h-7 w-7 text-secondary">
                    <ChevronLeft size={16} />
                </Button>

                <span className="text-xs font-semibold text-secondary min-w-[140px] text-center">
                    {weekStart && weekEnd
                        ? `${t("timesheet_week_of")} ${formatDate(weekStart)} – ${formatDate(weekEnd)}`
                        : "..."}
                </span>

                <Button variant="ghost" size="sm" onClick={() => shiftWeek(1)} aria-label="Next week" className="p-1 h-7 w-7 text-secondary">
                    <ChevronRight size={16} />
                </Button>
            </div>

            <Button variant="secondary" size="sm" onClick={goToThisWeek} className="h-7 px-2.5 py-1 text-[11px] font-semibold text-secondary">
                {t("timesheet_this_week")}
            </Button>
        </div>
    );
};
