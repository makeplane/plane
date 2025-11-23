import { useCallback } from "react";
// plane imports
import type { TExtendedFileHandler } from "@plane/editor";

export type TExtendedEditorFileHandlersArgs = {
  projectId?: string;
  workspaceSlug: string;
};

export type TExtendedEditorConfig = {
  getExtendedEditorFileHandlers: (args: TExtendedEditorFileHandlersArgs) => TExtendedFileHandler;
};

export const useExtendedEditorConfig = (): TExtendedEditorConfig => {
  const getExtendedEditorFileHandlers: TExtendedEditorConfig["getExtendedEditorFileHandlers"] = useCallback(
    () => ({}),
    []
  );

  return {
    getExtendedEditorFileHandlers,
  };
};
