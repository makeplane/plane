/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RefObject } from "react";
import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { BLOCK_HEIGHT } from "../constants";
import { ExternalPicker } from "./external-picker";
import { ExternalStubs } from "./external-stubs";
import type { TResolvedExternalLink } from "./external-links";
import { visibleLinks } from "./external-links";
import type { TGanttDependency, TGanttDependencyActions } from "./dependency-utils";
import { dependencyValidationMessages, getDependencyDraftStates } from "./dependency-utils";
import { buildArrows, resolveDrop } from "./drag-logic";

type Props = {
  blockIds: string[];
  externalLinks?: TResolvedExternalLink[];
  dependencies: TGanttDependency[];
  dependencyActions?: TGanttDependencyActions;
  ganttContainerRef: RefObject<HTMLDivElement>;
  showAllBlocks: boolean;
  width: number;
};

export const GanttDependencyLayer = observer(function GanttDependencyLayer(props: Props) {
  const { blockIds, dependencies, externalLinks, dependencyActions, ganttContainerRef, showAllBlocks, width } = props;
  const { getBlockById, dependencyDraftFromId, dependencyDraftSide, endDependencyDraft } = useTimeLineChartStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<TGanttDependency | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; targetId: string | null } | null>(null);
  const [externalPicker, setExternalPicker] = useState<{
    x: number;
    y: number;
    sourceId: string;
    side: "left" | "right";
  } | null>(null);
  const id = useId();
  const normalMarkerId = `${id}-dependency`;
  const violatedMarkerId = `${id}-dependency-violated`;
  const selectedMarkerId = `${id}-dependency-selected`;
  const rowData = useMemo(
    () =>
      computed(() => {
        const visibleBlocks = blockIds
          .map((blockId) => getBlockById(blockId))
          .filter((block) => block && block.data && (showAllBlocks || block.start_date || block.target_date));
        return new Map(
          visibleBlocks.map((block, index) => [block.id, { block, y: index * BLOCK_HEIGHT + BLOCK_HEIGHT / 2 }])
        );
      }),
    [blockIds, getBlockById, showAllBlocks]
  );
  const rows = rowData.get();
  const otherPairs = dependencyActions?.otherPairs;
  const draftStates = useMemo(
    () =>
      dependencyDraftFromId && otherPairs
        ? getDependencyDraftStates(dependencies, otherPairs, dependencyDraftFromId, dependencyDraftSide, [
            ...rows.keys(),
          ])
        : {},
    [dependencyDraftFromId, dependencyDraftSide, dependencies, otherPairs, rows]
  );
  const latest = useRef({ rows, dependencies, dependencyActions });
  latest.current = { rows, dependencies, dependencyActions };
  const selectedDependency =
    selected &&
    dependencies.find(
      (dep) => dep.predecessorId === selected.predecessorId && dep.successorId === selected.successorId
    );

  useEffect(() => {
    if (!dependencyActions || !selectedDependency) return;
    const deselect = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest("[data-gantt-dependency-control]"))
        setSelected(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setSelected(null);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        if (event.target instanceof Element && event.target.closest("input, textarea, [contenteditable=true]")) return;
        event.preventDefault();
        event.stopPropagation();
        void dependencyActions.remove(selectedDependency.predecessorId, selectedDependency.successorId);
        setSelected(null);
      }
    };
    document.addEventListener("mousedown", deselect);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", deselect);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [selectedDependency, dependencyActions]);

  const canEditDependencies = !!dependencyActions;
  useEffect(() => {
    if (!dependencyDraftFromId || !canEditDependencies) return;
    setSelected(null);
    setExternalPicker(null);
    setDraft(null);
    const readPointer = (event: MouseEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const block = element?.closest('[id^="gantt-block-"]');
      const targetId =
        block && ganttContainerRef.current?.contains(block) ? block.id.slice("gantt-block-".length) : null;
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, targetId };
    };
    const onMouseMove = (event: MouseEvent) => setDraft(readPointer(event));
    let finished = false;
    const onMouseUp = (event: MouseEvent) => {
      if (finished) return;
      finished = true;
      const pointer = readPointer(event);
      const { rows: currentRows, dependencies: currentDependencies, dependencyActions: actions } = latest.current;
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const result = resolveDrop({
        side: dependencyDraftSide,
        fromId: dependencyDraftFromId,
        targetId: pointer?.targetId ?? null,
        rowIds: new Set(currentRows.keys()),
        dependencies: currentDependencies,
        otherPairs: actions?.otherPairs ?? [],
        canCreateExternal: !!actions?.createExternal,
        overEmptyArea: !!(
          pointer &&
          element &&
          ganttContainerRef.current?.contains(element) &&
          overlayRef.current?.parentElement?.parentElement?.contains(element) &&
          !element.closest("[data-gantt-dependency-control], button, input, textarea, a") &&
          pointer.x >= 0 &&
          pointer.x <= width &&
          pointer.y >= 0
        ),
      });
      if (result.kind === "error") {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Không nối được",
          message: dependencyValidationMessages[result.error],
        });
      } else if (result.kind === "create") {
        void actions?.create(result.predecessorId, result.successorId);
      } else if (result.kind === "external-picker" && pointer) {
        setExternalPicker({
          x: Math.max(0, Math.min(pointer.x + 8, width - 320)),
          y: pointer.y + 8,
          sourceId: dependencyDraftFromId,
          side: dependencyDraftSide,
        });
      }
      endDependencyDraft();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") onMouseMove(event);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") onMouseUp(event);
    };
    const cancelDraft = () => {
      finished = true;
      endDependencyDraft();
    };
    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") cancelDraft();
    };
    const preventTouchScroll = (event: TouchEvent) => event.preventDefault();
    const cancel = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      cancelDraft();
    };
    const cancelOnBlur = cancelDraft;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerCancel);
    document.addEventListener("touchmove", preventTouchScroll, { passive: false });
    document.addEventListener("keydown", cancel, true);
    window.addEventListener("blur", cancelOnBlur);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
      document.removeEventListener("touchmove", preventTouchScroll);
      document.removeEventListener("keydown", cancel, true);
      window.removeEventListener("blur", cancelOnBlur);
      endDependencyDraft();
    };
  }, [dependencyDraftFromId, dependencyDraftSide, canEditDependencies, ganttContainerRef, endDependencyDraft, width]);

  const source = dependencyDraftFromId ? rows.get(dependencyDraftFromId) : undefined;
  const target = draft?.targetId ? rows.get(draft.targetId) : undefined;
  const targetError = draft?.targetId ? draftStates[draft.targetId] : null;
  const selectedPred = selectedDependency ? rows.get(selectedDependency.predecessorId) : undefined;
  const selectedSucc = selectedDependency ? rows.get(selectedDependency.successorId) : undefined;
  const fromX = selectedPred?.block.position
    ? selectedPred.block.position.marginLeft + selectedPred.block.position.width
    : 0;
  const toX = selectedSucc?.block.position?.marginLeft ?? 0;
  const deleteX = toX - fromX >= 16 ? (fromX + 8 + toX) / 2 : toX - 4;

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute top-0 left-0 [@media(pointer:coarse)]:[&_button[data-external-id]]:h-8 [@media(pointer:coarse)]:[&_button[data-external-id]]:w-8"
      style={{ width, height: rows.size * BLOCK_HEIGHT }}
    >
      <svg
        ref={svgRef}
        className="pointer-events-none absolute top-0 left-0 z-[4] overflow-visible"
        width={width}
        height={rows.size * BLOCK_HEIGHT}
        aria-hidden={dependencyActions ? undefined : true}
      >
        <defs>
          {[
            [normalMarkerId, "text-tertiary"],
            [violatedMarkerId, "text-danger-primary dark:text-[oklch(0.65_0.24_25)]"],
            [selectedMarkerId, "text-accent-primary"],
          ].map(([markerId, className]) => (
            <marker
              key={markerId}
              id={markerId}
              className={className}
              markerWidth={6}
              markerHeight={6}
              refX={6}
              refY={3}
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
            </marker>
          ))}
        </defs>
        <ExternalStubs
          links={visibleLinks(externalLinks ?? [], rows)}
          dependencyActions={dependencyActions}
          overlayRef={overlayRef}
          drafting={!!dependencyDraftFromId}
          onSelect={() => setSelected(null)}
          rows={rows}
          normalMarkerId={normalMarkerId}
          violatedMarkerId={violatedMarkerId}
        />
        {buildArrows(rows, dependencies, BLOCK_HEIGHT).map(
          ({ predecessorId, successorId, lagDays, path, violated }) => {
            const pred = rows.get(predecessorId)!;
            const isSelected =
              selectedDependency?.predecessorId === predecessorId && selectedDependency?.successorId === successorId;
            const select = () => setSelected({ predecessorId, successorId });
            return (
              <Fragment key={`${predecessorId}-${successorId}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isSelected || violated ? 2 : 1.5}
                  className={
                    isSelected
                      ? "text-accent-primary"
                      : violated
                        ? "text-danger-primary dark:text-[oklch(0.65_0.24_25)]"
                        : "text-tertiary"
                  }
                  markerEnd={`url(#${isSelected ? selectedMarkerId : violated ? violatedMarkerId : normalMarkerId})`}
                />
                {!!lagDays && (
                  <text
                    x={pred.block.position!.marginLeft + pred.block.position!.width + 5}
                    y={pred.y - 5}
                    className="fill-current text-10 text-tertiary"
                  >
                    {lagDays > 0 ? "+" : ""}
                    {lagDays}d
                  </text>
                )}
                {dependencyActions && (
                  <path
                    data-gantt-dependency-control
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={10}
                    style={{ pointerEvents: dependencyDraftFromId ? "none" : "stroke", cursor: "pointer" }}
                    // oxlint-disable-next-line jsx_a11y/prefer-tag-over-role -- SVG paths cannot be HTML buttons.
                    role="button"
                    tabIndex={0}
                    aria-label="Chọn phụ thuộc"
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
                  />
                )}
              </Fragment>
            );
          }
        )}
        {dependencyDraftFromId && source?.block.position && draft && (
          <path
            d={`M ${source.block.position.marginLeft + (dependencyDraftSide === "right" ? source.block.position.width : 0)} ${source.y} L ${draft.x} ${draft.y}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="5 4"
            className="text-accent-primary"
          />
        )}
      </svg>
      {dependencyDraftFromId && (
        <svg
          className="pointer-events-none absolute top-0 left-0 z-[6] overflow-visible"
          width={width}
          height={rows.size * BLOCK_HEIGHT}
          aria-hidden="true"
        >
          {[...rows].map(([blockId, { block, y }]) => {
            if (blockId === dependencyDraftFromId || !block.position) return null;
            const invalid = !!draftStates[blockId];
            return (
              <rect
                key={blockId}
                x={block.position.marginLeft}
                y={y - 16}
                width={block.position.width}
                height={32}
                rx={3}
                fill={invalid ? "currentColor" : "none"}
                stroke={invalid ? "none" : "currentColor"}
                strokeWidth={1.5}
                opacity={invalid ? 0.25 : 0.6}
                className={invalid ? "text-tertiary" : "text-success-primary"}
              />
            );
          })}
          {target?.block.position && target.block.id !== dependencyDraftFromId && (
            <rect
              x={target.block.position.marginLeft}
              y={target.y - 16}
              width={target.block.position.width}
              height={32}
              rx={3}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={targetError ? "text-danger-primary" : "text-success-primary"}
            />
          )}
        </svg>
      )}
      {dependencyDraftFromId && draft && (
        <div
          className={`pointer-events-none absolute z-[8] max-w-[240px] rounded-sm border border-strong bg-layer-1 px-2 py-1 text-11 whitespace-normal ${targetError ? "text-danger-primary" : "text-primary"}`}
          style={{ left: draft.x + 12, top: draft.y + 12 }}
        >
          {targetError
            ? dependencyValidationMessages[targetError]
            : target?.block.position
              ? "Thả để nối"
              : dependencyActions?.createExternal
                ? "Thả lên thanh việc hoặc chỗ trống để nối"
                : "Thả lên một thanh việc khác để nối"}
        </div>
      )}
      {externalPicker && dependencyActions?.createExternal && (
        <ExternalPicker
          x={externalPicker.x}
          y={externalPicker.y}
          onClose={() => setExternalPicker(null)}
          onSelect={(issueId, projectId) => {
            void dependencyActions.createExternal?.(externalPicker.sourceId, externalPicker.side, issueId, projectId);
            setExternalPicker(null);
          }}
        />
      )}
      {dependencyActions && selectedDependency && selectedPred?.block.position && selectedSucc?.block.position && (
        <div
          data-gantt-dependency-control
          className="pointer-events-auto absolute z-[8] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded border border-subtle bg-layer-1 p-1"
          style={{ left: deleteX, top: selectedSucc.y }}
        >
          {dependencyActions.lagsSupported && dependencyActions.setLag && (
            <label className="flex items-center gap-1 text-11 text-tertiary">
              Trễ (ngày)
              <input
                key={`${selectedDependency.predecessorId}-${selectedDependency.successorId}-${selectedDependency.lagDays ?? 0}`}
                type="number"
                min={-365}
                max={365}
                step={1}
                defaultValue={selectedDependency.lagDays ?? 0}
                className="w-16 rounded border border-subtle bg-layer-1 px-1 text-primary"
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                onBlur={(event) => {
                  const value = Number(event.currentTarget.value);
                  const valid = event.currentTarget.validity.valid;
                  event.currentTarget.value = String(selectedDependency.lagDays ?? 0);
                  if (!valid || !Number.isInteger(value)) {
                    setToast({ type: TOAST_TYPE.ERROR, title: "Độ trễ phải là số nguyên từ -365 đến 365" });
                    return;
                  }
                  if (value !== (selectedDependency.lagDays ?? 0))
                    void dependencyActions.setLag?.(
                      selectedDependency.predecessorId,
                      selectedDependency.successorId,
                      value
                    );
                }}
              />
            </label>
          )}
          <button
            type="button"
            aria-label="Xoá phụ thuộc"
            className="flex h-5 w-5 items-center justify-center rounded-full border border-strong bg-layer-1 text-danger-primary [@media(pointer:coarse)]:h-8 [@media(pointer:coarse)]:w-8"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              void dependencyActions.remove(selectedDependency.predecessorId, selectedDependency.successorId);
              setSelected(null);
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
});
