import { ExIssue } from "@plane/sdk";

export interface IssueReference {
  sequence: number;
  identifier: string;
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
    closingReferences.push(createPlaneIssueReference(issue));
    visitedIssues.add(issue);
  }

  for (const issue of allIssues) {
    if (visitedIssues.has(issue)) {
      continue;
    }
    nonClosingReferences.push(createPlaneIssueReference(issue));
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
const extractIssues = (text: string, pattern: RegExp): string[] => {
  return (text.match(pattern) || [])
    // Remove the square brackets from closed issues for consistency
    .map((issue) => issue.replace(/[\[\]]/g, ""))
    .filter((issue): issue is string => issue != null);
};

const createPlaneIssueReference = (issue: string): IssueReference => {
  const [identifier, sequence] = issue.split("-");
  return {
    identifier,
    sequence: parseInt(sequence),
  };
};

