import { parse } from "node-html-parser";
import { ExIssue } from "@plane/sdk";
import { E_MENTION_COMPONENT_ATTRIBUTES } from "./constants";

export interface IssueReference {
  sequence: number;
  identifier: string;
  isClosing: boolean;
}

export interface LinkedIssues {
  closingReferences: IssueReference[];
  nonClosingReferences: IssueReference[];
}

export interface IssueWithReference {
  issue: ExIssue;
  reference: IssueReference;
}

// PLANE-123
const ALL_PLANE_ISSUE_REGEX = /([A-Z0-9]+)-(\d+)/g;

// [PLANE-123] - Plane issue wrapped in square brackets
const CLOSED_PLANE_ISSUE_REGEX = /\[([A-Z0-9]+)-(\d+)\]/g;

/**
 * Get all the issues referenced in the text
 * Example text: This PR closes [PLANE-123] and references ABC-456, DEF-789ABC
 *
 * Out of these, the parser identifies the following:
 * - Closing issues: [PLANE-123] => Closes as the issue is wrapped in square brackets
 * - Non-closing issues: ABC-456, DEF-789
 *
 * @param text - This PR closes [PLANE-123] and references ABC-456, DEF-789ABC
 * @returns - An object containing the closing and non-closing references
 */
export const getReferredIssues = (text: string): LinkedIssues => {
  const closingReferences: IssueReference[] = [];
  const nonClosingReferences: IssueReference[] = [];

  const allIssues = extractIssues(text, ALL_PLANE_ISSUE_REGEX);
  const closedIssues = extractIssues(text, CLOSED_PLANE_ISSUE_REGEX);

  const visitedIssues = new Set<string>();

  for (const issue of closedIssues) {
    if (visitedIssues.has(issue)) {
      continue;
    }
    closingReferences.push(createPlaneIssueReference(issue, true));
    visitedIssues.add(issue);
  }

  for (const issue of allIssues) {
    if (visitedIssues.has(issue)) {
      continue;
    }
    nonClosingReferences.push(createPlaneIssueReference(issue, false));
    visitedIssues.add(issue);
  }

  return {
    closingReferences,
    nonClosingReferences,
  };
};

/**
 * Helper function to extract issue references using a regex pattern
 * @param text - The text to search for issues
 * @param pattern - The regex pattern to match issues
 * @returns Array of matched issue strings
 */
const extractIssues = (text: string, pattern: RegExp): string[] =>
  (text.match(pattern) || [])
    // Remove the square brackets from closed issues for consistency
    .map((issue) => issue.replace(/[\[\]]/g, ""))
    .filter((issue): issue is string => issue != null);

const createPlaneIssueReference = (issue: string, isClosing: boolean): IssueReference => {
  const [identifier, sequence] = issue.split("-");
  return {
    identifier,
    sequence: parseInt(sequence),
    isClosing,
  };
};

/**
 * Extracts user mentions from HTML using mention-component tags
 * @param html - HTML string containing mention components
 * @returns Array of unique user IDs mentioned in the HTML
 */
export const extractUserMentionFromHtml = (html: string): string[] => {
  const root = parse(html);
  const mentionComponents = root.querySelectorAll(E_MENTION_COMPONENT_ATTRIBUTES.TAG);
  const mentionedUserIds = mentionComponents
    .map((component) => component.getAttribute(E_MENTION_COMPONENT_ATTRIBUTES.ENTITY_IDENTIFIER))
    .filter((id) => id !== undefined);

  return [...new Set(mentionedUserIds)];
};
