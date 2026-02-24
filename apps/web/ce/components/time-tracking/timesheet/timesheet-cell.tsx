/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useCallback, useEffect } from "react";
import type { FC } from "react";
import { cn } from "@plane/utils";

interface TimesheetCellProps {
    minutes: number;
    onSave: (minutes: number) => void;
}

function formatHoursAndMinutes(m: number): string {
    if (!m || m === 0) return "";
    const h = Math.floor(m / 60);
    const mins = m % 60;
    if (h === 0) return `${mins}m`;
    if (mins === 0) return `${h}h`;
    return `${h}h ${mins}m`;
}

function parseHoursAndMinutes(val: string): number {
    const trimmed = val.trim();
    if (!trimmed) return 0;
    const match = trimmed.toLowerCase().match(/^(?:(\d+)h)?\s*(?:(\d+)m)?$/);
    if (!match) {
        const num = parseInt(trimmed, 10);
        return isNaN(num) || num < 0 ? 0 : num;
    }
    const h = parseInt(match[1] || "0", 10);
    const m = parseInt(match[2] || "0", 10);
    return h * 60 + m;
}

import { Input } from "@plane/propel/input";

/**
 * Editable cell for logging time.
 * Always renders an input for true interactive grid experience.
 * Accepts formats like "2h 30m" and parses back to minutes.
 */
export const TimesheetCell: FC<TimesheetCellProps> = ({ minutes, onSave }) => {
    const [draft, setDraft] = useState(formatHoursAndMinutes(minutes));

    // Keep internal draft synced with external props
    useEffect(() => {
        setDraft(formatHoursAndMinutes(minutes));
    }, [minutes]);

    const handleBlur = useCallback(() => {
        const parsed = parseHoursAndMinutes(draft);
        if (parsed !== minutes) {
            onSave(parsed);
        } else {
            // Reformat to correct display if unchanged
            setDraft(formatHoursAndMinutes(minutes));
        }
    }, [draft, minutes, onSave]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.currentTarget.blur();
            } else if (e.key === "Escape") {
                setDraft(formatHoursAndMinutes(minutes));
                e.currentTarget.blur();
            }
        },
        [minutes]
    );

    return (
        <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="—"
            mode="transparent"
            inputSize="sm"
            className={cn(
                "w-full text-center hover:bg-layer-1-hover transition-colors rounded-sm",
                minutes > 0 ? "text-primary font-medium bg-surface-1" : "text-tertiary"
            )}
            title="Type hours/minutes (e.g. 2h 30m)"
        />
    );
};
