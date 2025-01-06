export enum ETeamScope {
  YOUR_TEAMS = "your-teams",
  ALL_TEAMS = "all-teams",
}

export enum ETeamNavigationItem {
  OVERVIEW = "overview",
  PROJECTS = "projects",
  ISSUES = "issues",
  CYCLES = "cycles",
  VIEWS = "views",
  PAGES = "pages",
}

export enum ETeamEntityScope {
  TEAM = "teams",
  PROJECT = "projects",
}

export enum ETeamAnalyticsDataKeys {
  PROJECTS = "projects",
  MEMBERS = "members",
}

export enum ETeamAnalyticsValueKeys {
  ISSUES = "issues",
  // POINTS = "points",
}

export enum EWorkloadXAxisKeys {
  TARGET_DATE = "target_date",
  START_DATE = "start_date",
  PRIORITY = "priority",
}

export enum EWorkloadDataKeys {
  COMPLETED = "completed",
  PENDING = "pending",
  OVERDUE = "overdue",
}

export enum EDependencyType {
  BLOCKING = "blocking",
  BLOCKED_BY = "blocked_by",
}

export enum EStatisticsLegend {
  STATE = "state",
  PRIORITY = "priority",
}
