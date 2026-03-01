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

import { useState, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { X, Search, Lock, Code2 } from "lucide-react";
import useSWR from "swr";
// types
import type { ScriptFunction, FunctionCategory } from "@plane/types";
// ui
import { cn, Input, Loader } from "@plane/ui";
import { Button } from "@plane/propel/button";
// hooks
import { useFunctions } from "@/hooks/store/runners/use-functions";
// components
import { FunctionDetail } from "./function-detail";

const CATEGORIES: { value: FunctionCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "http", label: "HTTP" },
  { value: "notifications", label: "Notifications" },
  { value: "data", label: "Data" },
  { value: "utils", label: "Utils" },
  { value: "custom", label: "Custom" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
};

export const FunctionBrowserModal = observer(function FunctionBrowserModal({ isOpen, onClose, onInsert }: Props) {
  const { workspaceSlug } = useParams();
  const { fetchFunctions, getSystemFunctions, getWorkspaceFunctions, isLoading } = useFunctions();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FunctionCategory | "all">("all");
  const [selectedFunction, setSelectedFunction] = useState<ScriptFunction | null>(null);

  // Fetch functions on mount
  useSWR(
    workspaceSlug ? `FUNCTION_BROWSER_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchFunctions(workspaceSlug) : null
  );

  const systemFunctions = getSystemFunctions(workspaceSlug as string);
  const workspaceFunctions = getWorkspaceFunctions(workspaceSlug as string);

  // Filter functions
  const filteredFunctions = useMemo(() => {
    const allFunctions = [...systemFunctions, ...workspaceFunctions];
    return allFunctions.filter((fn) => {
      const matchesSearch =
        !searchQuery ||
        fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fn.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || fn.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [systemFunctions, workspaceFunctions, searchQuery, selectedCategory]);

  const handleInsert = () => {
    if (selectedFunction) {
      // Generate a basic call template
      const params = selectedFunction.parameters
        .filter((p) => p.required)
        .map((p) => `  ${p.name}: undefined`)
        .join(",\n");

      const code =
        params.length > 0
          ? `await Functions.${selectedFunction.name}({\n${params}\n})`
          : `await Functions.${selectedFunction.name}({})`;

      onInsert(code);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button type="button" className="absolute inset-0 bg-backdrop cursor-default" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-1 rounded-lg shadow-raised-200 w-full max-w-3xl h-[520px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-subtle">
          <div className="flex items-center gap-2">
            <Code2 className="size-4 text-icon-primary" />
            <h2 className="text-sm font-medium text-primary">Insert function</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-layer-1 rounded transition-colors">
            <X className="size-4 text-icon-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Panel - Function List */}
          <div className="w-[45%] border-r border-subtle flex flex-col gap-3 p-3">
            {/* Search */}
            <div className="flex items-center gap-2 border border-subtle-1 rounded-md px-2 h-7">
              <Search className="size-3.5 text-icon-tertiary" />
              <Input
                placeholder="Search functions"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none p-0 bg-transparent"
              />
            </div>

            {/* Categories */}
            <div className="flex overflow-x-auto gap-1.5">
              {CATEGORIES.map((cat) => (
                <Button
                  type="button"
                  variant={selectedCategory === cat.value ? "tertiary" : "secondary"}
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Function List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <Loader className="space-y-3">
                  <Loader.Item height="40px" />
                  <Loader.Item height="40px" />
                </Loader>
              ) : filteredFunctions.length === 0 ? (
                <div className="p-3 text-center text-body-sm-regular text-secondary">No functions found</div>
              ) : (
                <div className="space-y-3">
                  {filteredFunctions.map((fn) => (
                    <button
                      type="button"
                      key={fn.id}
                      onClick={() => setSelectedFunction(fn)}
                      className={cn(
                        "w-full px-3 py-2 text-left transition-colors border border-subtle rounded-lg",
                        selectedFunction?.id === fn.id ? "bg-layer-2-selected" : "bg-layer-2"
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {fn.is_system && <Lock className="size-3 text-icon-tertiary flex-shrink-0" />}
                        <span className="font-mono text-body-sm-medium text-primary truncate">{fn.name}</span>
                        <span
                          className={cn(
                            "px-1.5 h-5 flex items-center justify-center text-caption-sm-medium rounded-md capitalize flex-shrink-0 bg-accent-primary/10 text-accent-primary"
                          )}
                        >
                          {fn.category}
                        </span>
                      </div>
                      <p className="text-caption-md-regular text-tertiary line-clamp-1">{fn.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Function Detail */}
          <div className="flex flex-col bg-layer-1 flex-1">
            <div className="flex-1 overflow-y-auto p-3">
              {selectedFunction ? (
                <FunctionDetail fn={selectedFunction} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-layer-1 mb-2">
                    <Code2 className="size-5 text-icon-tertiary" />
                  </div>
                  <p className="text-body-xs-regular text-secondary">Select a function to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-subtle">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleInsert} disabled={!selectedFunction}>
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
});
