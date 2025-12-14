/**
 * FamilyFlow TypeScript types for Backlog
 *
 * Types for BacklogItem entity matching the Django models
 */

export type TBacklogItemStatus = "backlog" | "sprint" | "archived";

export interface IBacklogItem {
  id: string;
  family: string; // Family ID
  title: string;
  description: string | null;
  category: string; // Swim lane category
  priority: number; // Higher number = higher priority
  story_points: number | null; // 1-5 scale, optional
  creator: string; // FamilyMember ID
  status: TBacklogItemStatus;
  is_template: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  created_by: string | undefined;
  updated_by: string | undefined;
  // Computed/related fields
  family_name?: string;
  creator_name?: string;
}

export interface IBacklogItemLite {
  id: string;
  title: string;
  category: string;
  priority: number;
  status: TBacklogItemStatus;
  story_points: number | null;
}

// BacklogItem creation/update payloads
export interface IBacklogItemFormData {
  family: string; // Family ID
  title: string;
  description?: string | null;
  category: string;
  priority?: number; // Default: 0
  story_points?: number | null; // 1-5 scale, optional
  creator: string; // FamilyMember ID
  status?: TBacklogItemStatus; // Default: "backlog"
  is_template?: boolean; // Default: false
}

// Reorder payload
export interface IBacklogReorderPayload {
  item_ids: string[]; // Array of backlog item IDs in desired order
}

