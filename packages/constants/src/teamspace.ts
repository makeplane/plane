export enum ETeamspaceScope {
  YOUR_TEAMS = "your-teams",
  ALL_TEAMS = "all-teams",
}

export enum ETeamspaceNavigationItem {
  OVERVIEW = "overview",
  PROJECTS = "projects",
  ISSUES = "issues",
  CYCLES = "cycles",
  VIEWS = "views",
  PAGES = "pages",
}

export enum ETeamspaceEntityScope {
  TEAM = "teams",
  PROJECT = "projects",
}

export enum ETeamspaceAnalyticsDataKeys {
  PROJECTS = "projects",
  MEMBERS = "members",
}

export enum ETeamspaceAnalyticsValueKeys {
  ISSUES = "issues",
  // POINTS = "points",
}

export enum EProgressXAxisKeys {
  TARGET_DATE = "target_date",
  START_DATE = "start_date",
  PRIORITY = "priority",
}

export enum EProgressDataKeys {
  COMPLETED = "completed",
  PENDING = "pending",
  OVERDUE = "overdue",
}

export enum ERelationType {
  BLOCKING = "blocking",
  BLOCKED_BY = "blocked_by",
}

export enum EStatisticsLegend {
  STATE = "state",
  PRIORITY = "priority",
}
