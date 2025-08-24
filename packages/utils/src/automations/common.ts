// plane imports
import { joinUrlPath } from "../string";

// ------------ Settings path ------------

export type TAutomationSettingsPathProps = {
  workspaceSlug: string;
  projectId: string;
};

/**
 * Gets the base path for the automation settings page
 * @params workspaceSlug - The slug of the workspace
 * @params projectId - The ID of the project
 * @returns The base path for the automation settings page
 */
export const getAutomationSettingsPath = (props: TAutomationSettingsPathProps) =>
  joinUrlPath(props.workspaceSlug, "settings", "projects", props.projectId, "automations");
