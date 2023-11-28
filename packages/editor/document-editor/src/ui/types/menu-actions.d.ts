export interface IDuplicationConfig {
  action: () => Promise<void>;
}
export interface IPageLockConfig {
  is_locked: boolean;
  action: () => Promise<void>;
  locked_by?: string;
}
export interface IPageArchiveConfig {
  is_archived: boolean;
  archived_at?: Date;
  action: () => Promise<void>;
}
