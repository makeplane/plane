/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useProject } from "@/hooks/store/use-project";
import { observer } from "mobx-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TResolvedExternalLink } from "./external-links";
import type { TGanttDependencyActions } from "./dependency-utils";
import { isDependencyViolated } from "./dependency-utils";

type Row = {
  y: number;
  block: {
    position?: { marginLeft: number; width: number } | null;
    start_date?: string | null;
    target_date?: string | null;
  };
};

type Props = {
  links: TResolvedExternalLink[];
  dependencyActions?: TGanttDependencyActions;
  drafting: boolean;
  overlayRef: RefObject<HTMLDivElement>;
  onSelect: () => void;
  rows: Map<string, Row>;
  normalMarkerId: string;
  violatedMarkerId: string;
};

export const ExternalStubs = observer(function ExternalStubs({
  links,
  rows,
  normalMarkerId,
  violatedMarkerId,
  dependencyActions,
  drafting,
  onSelect,
  overlayRef,
}: Props) {
  const { getProjectById } = useProject();
  const [selected, setSelected] = useState<string | null>(null);
  const selectedRef = useRef<SVGGElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const editable = (link: TResolvedExternalLink) =>
    !link.peer && !!dependencyActions?.removeExternal && (getProjectById(link.projectId)?.member_role ?? 0) >= 15;
  const selectedLinks = links.filter((link) => `${link.localId}|${link.direction}` === selected && editable(link));
  useEffect(() => {
    if (drafting || !selectedLinks.length) setSelected(null);
  }, [drafting, selectedLinks.length]);
  useEffect(() => {
    if (!selectedLinks.length) return;
    const deselect = (event: MouseEvent) => {
      if (
        !(event.target instanceof Node) ||
        (!selectedRef.current?.contains(event.target) && !menuRef.current?.contains(event.target))
      )
        setSelected(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest("input, textarea, [contenteditable=true]")) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        setSelected(null);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        event.stopPropagation();
        const externalId =
          event.target instanceof Element
            ? event.target.closest("[data-external-id]")?.getAttribute("data-external-id")
            : null;
        void dependencyActions?.removeExternal?.(
          selectedLinks.find((link) => link.externalId === externalId) ?? selectedLinks[0]
        );
      }
    };
    document.addEventListener("mousedown", deselect);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", deselect);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [selectedLinks, dependencyActions]);
  // One stub per bar and side: several external links share it and join their codes in one label.
  const groups = new Map<string, TResolvedExternalLink[]>();
  for (const link of links) {
    const key = `${link.localId}|${link.direction}`;
    groups.set(key, [...(groups.get(key) ?? []), link]);
  }
  return [...groups.values()].map((group) => {
    const link = group[0];
    const row = rows.get(link.localId);
    if (!row?.block.position) return null;
    const successor = link.direction === "succ";
    const edge = row.block.position.marginLeft + (successor ? row.block.position.width : 0);
    const from = successor ? edge : edge - 28;
    const to = successor ? edge + 28 : edge;
    const violatedAny = group.some((item) =>
      successor
        ? isDependencyViolated(row.block.target_date, item.startDate)
        : isDependencyViolated(item.targetDate, row.block.start_date)
    );
    const lagText = (item: TResolvedExternalLink) =>
      item.lagDays ? ` ${item.lagDays > 0 ? "+" : ""}${item.lagDays}d` : "";
    const label = group.map((item) => `${item.code ?? "dự án khác"}${lagText(item)}`).join(" · ");
    const tooltip = group
      .map(
        (item) =>
          `${item.code ?? "dự án khác"} ${item.name ?? ""}${editable(item) ? "" : item.peer ? " — chưa có hàng trong bảng" : " — không đủ quyền sửa"}`
      )
      .join(", ");
    const key = `${link.localId}|${link.direction}`;
    const canEdit = group.some(editable);
    const isSelected = selected === key && canEdit && !drafting;
    const select = () => {
      setSelected(key);
      onSelect();
    };
    return (
      <g key={`${link.localId}-${link.direction}`} ref={isSelected ? selectedRef : undefined}>
        <path
          d={`M ${from} ${row.y} H ${to}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={violatedAny ? 2 : 1.5}
          strokeDasharray="5 4"
          className={violatedAny ? "text-danger-primary dark:text-[oklch(0.65_0.24_25)]" : "text-tertiary"}
          markerEnd={`url(#${violatedAny ? violatedMarkerId : normalMarkerId})`}
          pointerEvents="none"
        />
        {canEdit && (
          <path
            data-gantt-dependency-control
            d={`M ${from} ${row.y} H ${to}`}
            fill="none"
            stroke="transparent"
            strokeWidth={10}
            style={{ pointerEvents: drafting ? "none" : "stroke", cursor: "pointer" }}
            // oxlint-disable-next-line jsx_a11y/prefer-tag-over-role -- SVG paths cannot be HTML buttons.
            role="button"
            tabIndex={drafting ? -1 : 0}
            aria-label="Chọn phụ thuộc khác project"
            aria-pressed={isSelected}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              select();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                select();
              }
            }}
          >
            <title>{tooltip}</title>
          </path>
        )}
        {isSelected &&
          overlayRef.current &&
          createPortal(
            <div
              ref={menuRef}
              data-gantt-dependency-control
              className="pointer-events-auto absolute z-[8] w-fit rounded border border-subtle bg-layer-1 p-1 text-11 text-primary"
              style={{ left: Math.max(0, successor ? from - 44 : from - 120), top: row.y + 4 }}
            >
              {group.map((item) => (
                <div
                  key={item.externalId}
                  className="flex items-center justify-between gap-2 px-1 py-0.5"
                  title={editable(item) ? item.name : item.peer ? "chưa có hàng trong bảng" : "không đủ quyền sửa"}
                >
                  {group.length > 1 && <span>{item.code ?? "dự án khác"}</span>}
                  {editable(item) && (
                    <button
                      type="button"
                      data-external-id={item.externalId}
                      aria-label={`Xoá phụ thuộc ${item.code ?? "dự án khác"}`}
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-strong text-danger-primary"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        void dependencyActions?.removeExternal?.(item);
                      }}
                    >
                      ×
                    </button>
                  )}
                  {editable(item) && dependencyActions?.setExternalLag && (
                    <label className="flex items-center gap-1 text-tertiary">
                      Trễ (ngày)
                      <input
                        key={`${item.externalId}-${item.lagDays ?? 0}`}
                        type="number"
                        min={-365}
                        max={365}
                        step={1}
                        defaultValue={item.lagDays ?? 0}
                        className="w-14 rounded border border-subtle bg-layer-1 px-1 text-primary"
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === "Enter") event.currentTarget.blur();
                        }}
                        onBlur={(event) => {
                          const value = Number(event.currentTarget.value);
                          const valid = event.currentTarget.validity.valid;
                          event.currentTarget.value = String(item.lagDays ?? 0);
                          if (!valid || !Number.isInteger(value)) {
                            setToast({ type: TOAST_TYPE.ERROR, title: "Độ trễ phải là số nguyên từ -365 đến 365" });
                            return;
                          }
                          if (value !== (item.lagDays ?? 0)) void dependencyActions.setExternalLag?.(item, value);
                        }}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>,
            overlayRef.current
          )}
        <text
          x={successor ? to + 4 : from - 4}
          y={row.y - 5}
          textAnchor={successor ? "start" : "end"}
          className="fill-current text-10 text-tertiary"
          style={{ pointerEvents: "auto" }}
        >
          <title>{tooltip}</title>
          {label}
        </text>
      </g>
    );
  });
});
