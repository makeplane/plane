"use client";

import { Search, Layers, FolderKanban, FileText } from "lucide-react";
// plane imports
import { ContrastIcon, DiceIcon } from "@plane/propel/icons";
// local imports
import type { SearchScope, SearchScopeConfig } from "./power-k/types";

/**
 * Search scope configurations
 * Defines all available search scopes and their metadata
 */
export const SEARCH_SCOPES: Record<SearchScope, SearchScopeConfig> = {
  all: {
    id: "all",
    title: "All",
    placeholder: "Search everything",
    icon: Search,
  },
  "work-items": {
    id: "work-items",
    title: "Work Items",
    placeholder: "Search work items",
    icon: Layers,
  },
  projects: {
    id: "projects",
    title: "Projects",
    placeholder: "Search projects",
    icon: FolderKanban,
  },
  cycles: {
    id: "cycles",
    title: "Cycles",
    placeholder: "Search cycles",
    icon: ContrastIcon,
  },
  modules: {
    id: "modules",
    title: "Modules",
    placeholder: "Search modules",
    icon: DiceIcon,
  },
  pages: {
    id: "pages",
    title: "Pages",
    placeholder: "Search pages",
    icon: FileText,
  },
  views: {
    id: "views",
    title: "Views",
    placeholder: "Search views",
    icon: Layers,
  },
};

/**
 * Get scope configuration by ID
 */
export function getScopeConfig(scope: SearchScope): SearchScopeConfig {
  return SEARCH_SCOPES[scope];
}

/**
 * Get all available scopes
 */
export function getAllScopes(): SearchScopeConfig[] {
  return Object.values(SEARCH_SCOPES);
}

/**
 * Get scopes available in current context
 * Some scopes may only be available in certain contexts (e.g., cycles only in project context)
 */
export function getAvailableScopes(hasProjectContext: boolean): SearchScopeConfig[] {
  const scopes = [SEARCH_SCOPES.all, SEARCH_SCOPES["work-items"], SEARCH_SCOPES.projects];

  // Project-level scopes only available when in project context
  if (hasProjectContext) {
    scopes.push(SEARCH_SCOPES.cycles, SEARCH_SCOPES.modules, SEARCH_SCOPES.pages, SEARCH_SCOPES.views);
  }

  return scopes;
}

/**
 * Filter search results based on active scope
 */
export function filterResultsByScope<T extends { results: any }>(results: T, scope: SearchScope): T {
  if (scope === "all") {
    return results;
  }

  // Create filtered results with only the active scope
  const filtered = {
    ...results,
    results: {
      issues: scope === "work-items" ? results.results.issues : [],
      projects: scope === "projects" ? results.results.projects : [],
      cycles: scope === "cycles" ? results.results.cycles : [],
      modules: scope === "modules" ? results.results.modules : [],
      pages: scope === "pages" ? results.results.pages : [],
      views: scope === "views" ? results.results.views : [],
    },
  };

  return filtered as T;
}

/**
 * Get keyboard shortcut for scope
 */
export function getScopeShortcut(scope: SearchScope): string | undefined {
  const shortcuts: Record<SearchScope, string | undefined> = {
    all: undefined,
    "work-items": "c",
    projects: "p",
    cycles: "q",
    modules: "m",
    pages: "d",
    views: "v",
  };

  return shortcuts[scope];
}
