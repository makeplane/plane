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
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent } from "@tiptap/react";
import { Copy, Check, ChevronDown, Search } from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { cn } from "@plane/utils";
import type { CodeBlockOptions } from "./code-block";
import { CODE_LANGUAGES } from "./constants";
import { MermaidPreview } from "./mermaid-preview";
import { YChangeNodeViewWrapper } from "../../components/editors/version-diff/extensions/ychange-node-view-wrapper";
import type { Decoration } from "@tiptap/pm/view";

type TCodeBlockAttributes = {
  language: string;
  isCodeHidden?: boolean;
};

export type CodeBlockNodeViewProps = Omit<NodeViewProps, "node"> & {
  node: NodeViewProps["node"] & {
    attrs: TCodeBlockAttributes;
  };
  decorations?: readonly Decoration[];
};

// Cache for language label lookups (js-cache-function-results)
const languageLabelCache = new Map<string, string>();
function getLanguageLabel(languageId: string): string {
  const cached = languageLabelCache.get(languageId);
  if (cached) return cached;

  const label = CODE_LANGUAGES.find((lang) => lang.id === languageId)?.label ?? "Plain Text";
  languageLabelCache.set(languageId, label);
  return label;
}

export function CodeBlockComponent(props: CodeBlockNodeViewProps) {
  const { node, updateAttributes, extension, decorations } = props;
  const [copied, setCopied] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const enableMermaidPreview = (extension.options as CodeBlockOptions).enableMermaidPreview ?? false;
  const currentLanguage = node.attrs.language || "plaintext";
  const isCodeHidden = node.attrs.isCodeHidden ?? false;
  const isMermaid = enableMermaidPreview && currentLanguage === "mermaid";
  const currentLanguageLabel = getLanguageLabel(currentLanguage);

  const { refs, floatingStyles, context } = useFloating({
    placement: "bottom-end",
    middleware: [
      offset(4),
      flip({ fallbackPlacements: ["top-end", "bottom-start", "top-start"] }),
      shift({ padding: 8 }),
    ],
    open: isLanguageDropdownOpen,
    onOpenChange: (open) => {
      setIsLanguageDropdownOpen(open);
      if (!open) setSearchQuery("");
    },
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  const handleToggleCodeVisibility = useCallback(() => {
    updateAttributes({ isCodeHidden: !isCodeHidden });
  }, [isCodeHidden, updateAttributes]);

  const copyToClipboard = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard
        .writeText(node.textContent)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
        .catch(() => setCopied(false));
    },
    [node.textContent]
  );

  const handleLanguageSelect = useCallback(
    (languageId: string) => {
      updateAttributes({ language: languageId });
      setIsLanguageDropdownOpen(false);
      setSearchQuery("");
    },
    [updateAttributes]
  );

  // Cache available languages based on feature flags
  const availableLanguages = useMemo(() => {
    if (enableMermaidPreview) return CODE_LANGUAGES;
    return CODE_LANGUAGES.filter((lang) => lang.id !== "mermaid");
  }, [enableMermaidPreview]);

  // Cache filtered languages (js-cache-function-results via useMemo)
  const filteredLanguages = useMemo(() => {
    if (!searchQuery) return availableLanguages;
    const query = searchQuery.toLowerCase();
    return availableLanguages.filter(
      (lang) =>
        lang.label.toLowerCase().includes(query) ||
        lang.id.toLowerCase().includes(query) ||
        lang.aliases?.some((alias) => alias.toLowerCase().includes(query))
    );
  }, [searchQuery, availableLanguages]);

  useEffect(() => {
    if (isLanguageDropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isLanguageDropdownOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLanguageDropdownOpen(false);
        setSearchQuery("");
      } else if (e.key === "Enter" && filteredLanguages.length > 0) {
        handleLanguageSelect(filteredLanguages[0].id);
      }
    },
    [filteredLanguages, handleLanguageSelect]
  );

  return (
    <YChangeNodeViewWrapper
      decorations={decorations}
      className="code-block relative group/code"
      data-dropdown-open={isLanguageDropdownOpen}
    >
      {/* Toolbar - hidden when mermaid preview is shown without code */}
      <div
        className={cn(
          "hidden group-hover/code:flex group-data-[dropdown-open=true]/code:flex items-center gap-1 absolute top-2 right-2 z-10",
          isMermaid && isCodeHidden && "!hidden"
        )}
        style={{ fontSize: "12px" }}
      >
        {/* Language Selector */}
        <button
          ref={refs.setReference}
          type="button"
          className={cn(
            "flex items-center justify-center gap-1 h-6 px-1.5 rounded bg-layer-1/90 border border-subtle/60 backdrop-blur-sm text-tertiary hover:text-primary outline-none",
            { "bg-layer-1-selected": isLanguageDropdownOpen }
          )}
          {...getReferenceProps()}
        >
          <span className="max-w-16 truncate">{currentLanguageLabel}</span>
          <ChevronDown
            className={cn("size-3 transition-transform duration-200", {
              "rotate-180": isLanguageDropdownOpen,
            })}
          />
        </button>

        {isLanguageDropdownOpen && (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
              role="listbox"
              tabIndex={-1}
              style={{ ...floatingStyles, zIndex: 100, fontSize: "12px" }}
              className="w-32 rounded border border-subtle bg-surface-1 shadow-raised-200 overflow-hidden"
              {...getFloatingProps()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="p-1 border-b border-subtle">
                <div className="relative">
                  <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 size-3 text-placeholder" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full pl-5 pr-1.5 py-1 text-xs rounded border border-subtle bg-layer-1 outline-none placeholder:text-placeholder focus:border-accent-primary transition-colors"
                  />
                </div>
              </div>
              <div className="max-h-36 overflow-y-auto p-0.5">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      className={cn(
                        "w-full text-left px-2 py-1 text-xs rounded cursor-pointer transition-colors outline-none",
                        {
                          "bg-accent-subtle text-accent-primary font-medium": lang.id === currentLanguage,
                          "text-secondary hover:bg-layer-1 hover:text-primary": lang.id !== currentLanguage,
                        }
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLanguageSelect(lang.id);
                      }}
                    >
                      {lang.label}
                    </button>
                  ))
                ) : (
                  <div className="px-2 py-2 text-xs text-placeholder text-center">No languages found</div>
                )}
              </div>
            </div>
          </FloatingPortal>
        )}

        {/* Copy Button */}
        <button
          type="button"
          onClick={copyToClipboard}
          className={cn(
            "flex items-center justify-center size-6 rounded border backdrop-blur-sm transition-colors outline-none",
            copied
              ? "bg-success-subtle border-success-subtle text-success-primary"
              : "bg-layer-1/90 border-subtle/60 text-tertiary hover:text-primary hover:bg-layer-1-hover"
          )}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </button>
      </div>

      {/* Code block content */}
      {!(isMermaid && isCodeHidden) && (
        <pre
          className={cn("bg-layer-1 text-primary rounded-lg p-4 my-2", {
            "rounded-b-none mb-0": isMermaid,
          })}
        >
          <NodeViewContent as="code" className="whitespace-pre-wrap" />
        </pre>
      )}

      {/* Mermaid Preview */}
      {isMermaid && (
        <MermaidPreview
          code={node.textContent}
          isCodeVisible={!isCodeHidden}
          onToggleCodeVisible={handleToggleCodeVisibility}
        />
      )}
    </YChangeNodeViewWrapper>
  );
}
