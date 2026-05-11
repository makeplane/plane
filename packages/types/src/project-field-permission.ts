/**
 * Types and enum for project-level field permissions that control
 * which actions members (non-admins) are allowed to perform.
 */

export enum EProjectFieldPermissionKey {
  COMPLETED_DATE = "completed_date",
  TARGET_DATE = "target_date",
  START_DATE = "start_date",
  DELETE_WORK_ITEM = "delete_work_item",
}

/** Maps EProjectFieldPermissionKey → backend boolean field name. */
export const PROJECT_FIELD_PERMISSION_BACKEND_KEY: Record<EProjectFieldPermissionKey, keyof IProjectFieldPermission> = {
  [EProjectFieldPermissionKey.COMPLETED_DATE]: "allow_member_modify_completed_date",
  [EProjectFieldPermissionKey.TARGET_DATE]: "allow_member_modify_target_date",
  [EProjectFieldPermissionKey.START_DATE]: "allow_member_modify_start_date",
  [EProjectFieldPermissionKey.DELETE_WORK_ITEM]: "allow_member_delete_work_item",
};

/** Shape of the backend response/payload for project field permissions. */
export interface IProjectFieldPermission {
  allow_member_modify_completed_date: boolean;
  allow_member_modify_target_date: boolean;
  allow_member_modify_start_date: boolean;
  allow_member_delete_work_item: boolean;
}
