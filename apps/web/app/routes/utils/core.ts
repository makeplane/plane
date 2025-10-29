/**
 * Helper to create workspace-scoped route paths
 * @param path - The path after the workspace slug
 * @returns The full route path with workspace slug parameter
 */
export const workspaceRoute = (path: string) => `:workspaceSlug/${path}`;

/**
 * Helper to create project-scoped route paths
 * @param path - The path after the project ID
 * @returns The full route path with workspace slug and project ID parameters
 */
export const projectRoute = (path: string) => `:workspaceSlug/projects/:projectId/${path}`;
