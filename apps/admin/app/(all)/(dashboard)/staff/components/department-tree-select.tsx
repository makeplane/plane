/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { cn } from "@plane/utils";
import type { IInstanceDepartment } from "@plane/services";
import { useInstanceDepartment } from "@/hooks/store";

// Recursively filter tree nodes matching query
function filterTree(nodes: IInstanceDepartment[], query: string): IInstanceDepartment[] {
  if (!query) return nodes;
  const q = query.toLowerCase();
  return nodes.reduce<IInstanceDepartment[]>((acc, node) => {
    const match = node.name.toLowerCase().includes(q) || node.code.toLowerCase().includes(q);
    const filteredChildren = filterTree(node.children ?? [], query);
    if (match || filteredChildren.length > 0) {
      acc.push({ ...node, children: filteredChildren });
    }
    return acc;
  }, []);
}

type TreeNodeProps = {
  dept: IInstanceDepartment;
  depth: number;
  selectedId: string;
  onSelect: (dept: IInstanceDepartment) => void;
  forceExpanded: boolean;
};

const TreeNode = observer(function TreeNode({ dept, depth, selectedId, onSelect, forceExpanded }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (dept.children?.length ?? 0) > 0;
  const isSelected = dept.id === selectedId;
  // When search is active, force all nodes expanded
  const isExpanded = forceExpanded || expanded;

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(dept)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-1.5 text-left text-13 rounded hover:bg-layer-1-hover",
          isSelected && "bg-accent-subtle text-accent-primary"
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <button
          type="button"
          tabIndex={hasChildren ? 0 : -1}
          onClick={(e) => {
            if (!hasChildren) return;
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className={cn("w-4 h-4 flex-shrink-0 text-tertiary p-0 bg-transparent border-0", !hasChildren && "invisible")}
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90")} />
        </button>
        <span className="truncate flex-1">{dept.name}</span>
        <span className="text-11 font-mono text-tertiary flex-shrink-0">{dept.code}</span>
      </button>

      {hasChildren && isExpanded && (
        <div>
          {dept.children!.map((child) => (
            <TreeNode
              key={child.id}
              dept={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              forceExpanded={forceExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
});

type Props = {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const DepartmentTreeSelect = observer(function DepartmentTreeSelect({
  value,
  onChange,
  placeholder = "— None —",
  disabled = false,
}: Props) {
  const { tree, departments } = useInstanceDepartment();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedName = value ? departments[value]?.name : undefined;
  const filtered = filterTree(tree, query);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (dept: IInstanceDepartment) => {
    onChange(dept.id);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2 rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 text-left",
          "hover:border-primary transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="flex-1 truncate">{selectedName ?? <span className="text-tertiary">{placeholder}</span>}</span>
        {value && <X className="w-3.5 h-3.5 text-tertiary hover:text-primary flex-shrink-0" onClick={handleClear} />}
        <ChevronDown className={cn("w-4 h-4 text-tertiary flex-shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[240px] rounded-md border border-subtle bg-layer-2 shadow-lg">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-subtle">
            <Search className="w-3.5 h-3.5 text-tertiary flex-shrink-0" />
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search department..."
              className="flex-1 bg-transparent text-13 outline-none placeholder:text-tertiary"
            />
          </div>

          {/* Tree */}
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
                setQuery("");
              }}
              className={cn(
                "w-full px-3 py-1.5 text-left text-13 text-tertiary rounded hover:bg-layer-1-hover",
                !value && "bg-accent-subtle text-accent-primary"
              )}
            >
              {placeholder}
            </button>
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-13 text-tertiary">No departments found</p>
            ) : (
              filtered.map((dept) => (
                <TreeNode
                  key={dept.id}
                  dept={dept}
                  depth={0}
                  selectedId={value}
                  onSelect={handleSelect}
                  forceExpanded={query.length > 0}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});
