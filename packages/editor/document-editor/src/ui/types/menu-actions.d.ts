
export interface IDuplicationConfig {
  action: () => Promise<void>
}
export interface IPageLockConfig {
	is_locked: boolean,
  action: () => Promise<void>
}
export interface IPageArchiveConfig {
	is_archived: boolean,
  action: () => Promise<void>
  }
