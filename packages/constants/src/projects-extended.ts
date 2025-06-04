export enum EProjectPriority {
  NONE = "none",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum EProjectStateGroup {
  DRAFT = "draft",
  PLANNING = "planning",
  EXECUTION = "execution",
  MONITORING = "monitoring",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum EProjectAccess {
  PUBLIC = "public",
  PRIVATE = "private",
}

export enum EProjectStateLoader {
  INIT_LOADER = "project-state-init-loader",
  MUTATION_LOADER = "project-state-mutation-loader",
}
