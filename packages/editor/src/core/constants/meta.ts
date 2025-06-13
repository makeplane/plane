export const CORE_EDITOR_META = {
  SKIP_FILE_DELETION: "skipFileDeletion",
} as const;

export type CORE_EDITOR_META = typeof CORE_EDITOR_META[keyof typeof CORE_EDITOR_META];
