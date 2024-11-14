import { TEditorVersion } from "@plane/types";

export type TVersionEditorProps = {
  activeVersion: string | null;
  currentVersionDescription: string | null;
  isCurrentVersionActive: boolean;
  versionDetails: TEditorVersion | undefined;
};

export * from "./issue-version-editor";
export * from "./page-version-editor";
