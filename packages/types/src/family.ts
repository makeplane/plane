/**
 * FamilyFlow TypeScript types
 * 
 * Types for Family and FamilyMember entities matching the Django models
 */

export type TFamilyRole = "parent" | "child";

export interface IFamily {
  id: string;
  name: string;
  sprint_duration: number; // 7 for weekly, 14 for bi-weekly
  default_swim_lanes: string[]; // ["Chores", "School/Activities", etc.]
  custom_swim_lanes: string[] | null;
  gamification_enabled: boolean;
  baseline_capacity: number | null; // Baseline sprint capacity in story points
  created_at: Date | string;
  updated_at: Date | string;
  created_by: string | undefined;
  updated_by: string | undefined;
  // Computed fields
  total_members?: number;
  all_swim_lanes?: string[]; // Combined default and custom lanes
}

export interface IFamilyLite {
  id: string;
  name: string;
  sprint_duration: number;
  gamification_enabled: boolean;
}

export interface IFamilyMember {
  id: string;
  user: string; // User ID
  family: string; // Family ID
  name: string; // Display name in family context
  age: number | null; // Required for children, optional for adults
  role: TFamilyRole;
  avatar_url: string | null;
  joined_at: Date | string;
  is_active: boolean;
  use_kid_interface: boolean | null; // null = auto based on age < 13
  created_at: Date | string;
  updated_at: Date | string;
  created_by: string | undefined;
  updated_by: string | undefined;
  // Computed/related fields
  family_name?: string;
  user_email?: string;
  user_display_name?: string;
  should_use_kid_interface?: boolean;
}

export interface IFamilyMemberLite {
  id: string;
  name: string;
  role: TFamilyRole;
  age: number | null;
  avatar_url: string | null;
  is_active: boolean;
}

// Family creation/update payloads
export interface IFamilyFormData {
  name: string;
  sprint_duration?: number; // Default: 7
  default_swim_lanes?: string[];
  custom_swim_lanes?: string[] | null;
  gamification_enabled?: boolean;
  baseline_capacity?: number | null;
}

export interface IFamilyMemberFormData {
  user: string;
  family: string;
  name: string;
  age?: number | null;
  role: TFamilyRole;
  avatar_url?: string | null;
  is_active?: boolean;
  use_kid_interface?: boolean | null;
}

