import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { workspaceRoute, projectRoute } from "@/app/routes/utils/core";


export const coreProjectRoutes: RouteConfigEntry[] = [
  // ========================================================================
  // PROJECT LIST
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(projects)/projects/(list)/layout.tsx", [
    route(workspaceRoute("projects"), "./(all)/[workspaceSlug]/(projects)/projects/(list)/page.tsx"),
  ]),

  // ========================================================================
  // PROJECT DETAIL ROUTES
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/layout.tsx", [
    // ======================================================================
    // ARCHIVED PROJECTS
    // ======================================================================
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/archives/layout.tsx", [
      route(
        workspaceRoute("projects/archives"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/archives/page.tsx"
      ),
    ]),

    // ======================================================================
    // PROJECT ISSUES
    // ======================================================================
    // Issues List
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(list)/layout.tsx", [
      route(
        projectRoute("issues"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(list)/page.tsx"
      ),
    ]),

    // Issue Detail
    route(
      projectRoute("issues/:issueId"),
      "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(detail)/[issueId]/page.tsx"
    ),

    // ======================================================================
    // PROJECT CYCLES
    // ======================================================================
    // Cycles List
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(list)/layout.tsx", [
      route(
        projectRoute("cycles"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(list)/page.tsx"
      ),
    ]),

    // Cycle Detail
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(detail)/layout.tsx", [
      route(
        projectRoute("cycles/:cycleId"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(detail)/[cycleId]/page.tsx"
      ),
    ]),

    // ======================================================================
    // PROJECT MODULES
    // ======================================================================
    // Modules List
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(list)/layout.tsx", [
      route(
        projectRoute("modules"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(list)/page.tsx"
      ),
    ]),

    // Module Detail
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(detail)/layout.tsx", [
      route(
        projectRoute("modules/:moduleId"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(detail)/[moduleId]/page.tsx"
      ),
    ]),

    // ======================================================================
    // PROJECT VIEWS
    // ======================================================================
    // Views List
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(list)/layout.tsx", [
      route(
        projectRoute("views"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(list)/page.tsx"
      ),
    ]),

    // View Detail
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(detail)/layout.tsx", [
      route(
        projectRoute("views/:viewId"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(detail)/[viewId]/page.tsx"
      ),
    ]),

    // ======================================================================
    // PROJECT PAGES
    // ======================================================================
    // Pages List
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(list)/layout.tsx", [
      route(
        projectRoute("pages"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(list)/page.tsx"
      ),
    ]),

    // Page Detail
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(detail)/layout.tsx", [
      route(
        projectRoute("pages/:pageId"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(detail)/[pageId]/page.tsx"
      ),
    ]),

    // ======================================================================
    // PROJECT INTAKE
    // ======================================================================
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/intake/layout.tsx", [
      route(projectRoute("intake"), "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/intake/page.tsx"),
    ]),

    // ======================================================================
    // PROJECT ARCHIVES - Issues, Cycles, Modules
    // ======================================================================
    // Archived Issues - List
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(list)/layout.tsx", [
      route(
        projectRoute("archives/issues"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(list)/page.tsx"
      ),
    ]),

    // Archived Issues - Detail
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(detail)/layout.tsx", [
      route(
        projectRoute("archives/issues/:archivedIssueId"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(detail)/[archivedIssueId]/page.tsx"
      ),
    ]),

    // Archived Cycles
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/cycles/layout.tsx", [
      route(
        projectRoute("archives/cycles"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/cycles/page.tsx"
      ),
    ]),

    // Archived Modules
    layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/modules/layout.tsx", [
      route(
        projectRoute("archives/modules"),
        "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/modules/page.tsx"
      ),
    ]),
  ]),
] as const;
