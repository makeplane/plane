// Horizontal Stack Asset Types
export type HorizontalStackAssetType =
  | "customer"
  | "epic"
  | "estimate"
  | "export"
  | "intake"
  | "label"
  | "link"
  | "members"
  | "note"
  | "priority"
  | "project"
  | "settings"
  | "state"
  | "template"
  | "token"
  | "unknown"
  | "update"
  | "webhook"
  | "work-item"
  | "worklog";

// Vertical Stack Asset Types
export type VerticalStackAssetType =
  | "archived-cycle"
  | "archived-module"
  | "archived-work-item"
  | "changelog"
  | "customer"
  | "cycle"
  | "dashboard"
  | "draft"
  | "epic"
  | "error-404"
  | "initiative"
  | "invalid-link"
  | "module"
  | "no-access"
  | "page"
  | "project"
  | "server-error"
  | "teamspace"
  | "view"
  | "work-item";

// Illustration Asset Types
export type IllustrationAssetType = "inbox" | "search";

// Combined Asset Types for Compact (uses horizontal + illustration)
export type CompactAssetType = HorizontalStackAssetType | IllustrationAssetType;

// Combined Asset Types for Detailed (uses vertical + illustration)
export type DetailedAssetType = VerticalStackAssetType | IllustrationAssetType;
