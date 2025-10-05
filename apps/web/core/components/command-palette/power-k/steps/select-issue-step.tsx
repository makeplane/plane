"use client";

import React from "react";
// plane imports
import type { IWorkspaceSearchResults } from "@plane/types";
// local imports
import { CommandPaletteSearchResults } from "../actions";

interface SelectIssueStepProps {
  workspaceSlug: string;
  projectId?: string;
  searchTerm: string;
  debouncedSearchTerm: string;
  results: IWorkspaceSearchResults;
  isLoading: boolean;
  isSearching: boolean;
  isWorkspaceLevel: boolean;
  resolvedPath: string;
  onClose: () => void;
}

/**
 * Reusable issue selection step component
 * Can be used in any multi-step command flow
 */
export const SelectIssueStep: React.FC<SelectIssueStepProps> = ({ onClose, results }) => <CommandPaletteSearchResults closePalette={onClose} results={results} />;
