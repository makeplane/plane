"use client";

import React from "react";
import { IWorkspaceSearchResults } from "@plane/types";
import { CommandPaletteSearchResults } from "@/components/command-palette";

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
export const SelectIssueStep: React.FC<SelectIssueStepProps> = ({
  onClose,
  results,
}) => {
  return <CommandPaletteSearchResults closePalette={onClose} results={results} />;
};
