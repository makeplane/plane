import { HTMLElement } from "node-html-parser";
import { v4 as uuidv4 } from 'uuid';
import { Client, ExIssue, ExModule } from "@plane/sdk";
import { E_IMPORTER_KEYS } from "@/core";
import { LinearService } from "@/linear/services";
import { IParserExtension } from "@/parser";

const LINEAR_ISSUE_LINK_REGEX = /https:\/\/linear\.app\/([\w.-]+)\/issue\/([\w.-]+)/;

export type LinearMentionParserConfig = {
  workspaceSlug: string;
  projectId: string;
  planeClient: Client;
  linearService: LinearService;
}

export class LinearIssueMentionParserExtension implements IParserExtension {

  constructor(private readonly config: LinearMentionParserConfig) { }

  shouldParse(node: HTMLElement): boolean {
    const isNodeCompatible = node.tagName === "A";
    const isIssueLink = LINEAR_ISSUE_LINK_REGEX.test(node.getAttribute("href") ?? "");
    return isNodeCompatible && isIssueLink;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    const issueLink = node.getAttribute("href") ?? "";
    const issueId = issueLink.match(LINEAR_ISSUE_LINK_REGEX)?.[2];
    if (!issueId) {
      return node;
    }
    const issue = await this.getIssue(issueId);

    if (!issue) {
      return node;
    }

    const mentionComponent = await this.createMentionComponent(issue);
    return mentionComponent;
  }

  async createMentionComponent(issue: ExIssue): Promise<HTMLElement> {
    const mentionComponent = new HTMLElement("issue-embed-component", {}, "");
    mentionComponent.setAttribute("entity_identifier", issue.id);
    mentionComponent.setAttribute("project_identifier", issue.project);
    mentionComponent.setAttribute("workspace_identifier", this.config.workspaceSlug);
    mentionComponent.setAttribute("id", uuidv4());
    mentionComponent.setAttribute("entity_name", "issue");
    return mentionComponent;
  }

  async getIssue(externalIssueId: string): Promise<ExIssue | null> {
    // Get the issue from Linear
    const issue = await this.config.linearService.getIssueByIdentifier(externalIssueId);
    if (!issue) {
      return null
    }

    // Get the corresponding Plane issue
    const planeIssue = await this.config.planeClient.issue.getIssueWithExternalId(this.config.workspaceSlug, this.config.projectId, issue.id, E_IMPORTER_KEYS.LINEAR);
    if (!planeIssue) {
      return null
    }

    return planeIssue;
  }
}

const LINEAR_PROJECT_LINK_REGEX = /https:\/\/linear\.app\/[\w.-]+\/project\/([\w.-]+)/;

export type LinearProjectMentionParserConfig = LinearMentionParserConfig & {
  APP_BASE_URL: string;
}

export class LinearProjectMentionParserExtension implements IParserExtension {
  constructor(private readonly config: LinearProjectMentionParserConfig) { }

  shouldParse(node: HTMLElement): boolean {
    const isNodeCompatible = node.tagName === "A";
    const isProjectLink = LINEAR_PROJECT_LINK_REGEX.test(node.getAttribute("href") ?? "");
    return isNodeCompatible && isProjectLink;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    const projectLink = node.getAttribute("href") ?? "";
    const projectId = projectLink.match(LINEAR_PROJECT_LINK_REGEX)?.[1];
    if (!projectId) {
      return node;
    }

    let planeModule: ExModule | null = null;

    try {
      planeModule = await this.getPlaneModule(projectId);
      if (!planeModule) {
        return node;
      }
    } catch (error) {
      console.error("Error getting plane module", error);
      return node;
    }

    const mentionComponent = await this.createMentionComponent(node, planeModule);
    return mentionComponent;
  }

  async getPlaneModule(projectMentionIdentifier: string): Promise<ExModule | null> {
    const split = projectMentionIdentifier.split("-");
    const projectId = split[split.length - 1];

    const project = await this.config.linearService.getProject(projectId);
    if (!project) {
      return null;
    }

    const planeModule = await this.config.planeClient.modules.getModuleByExternalId(this.config.workspaceSlug, this.config.projectId, project.id, E_IMPORTER_KEYS.LINEAR);
    if (!planeModule) {
      return null;
    }

    return planeModule;
  }

  /*
   As of now, we don't have a way to mention a project in Linear.
   So, we'll just return a A tag with the project name.
  */
  async createMentionComponent(node: HTMLElement, planeModule: ExModule): Promise<HTMLElement> {
    // Update the href with the project mention identifier
    node.setAttribute("href", `${this.config.APP_BASE_URL}/${this.config.workspaceSlug}/projects/${this.config.projectId}/modules/${planeModule.id}`);

    // Update the text content to show the module name
    node.textContent = planeModule.name || "Module";

    // Add styling classes if needed
    node.setAttribute("class", "text-custom-primary-300 underline underline-offset-[3px] hover:text-custom-primary-500 transition-colors cursor-pointer");

    return node;
  }
}
