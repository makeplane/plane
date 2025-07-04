import { RecordWithLinks } from "@flatfile/api/api";
import { v4 as uuidv4 } from "uuid";
import { ExCycle, ExIssue, ExIssueLabel, ExIssueType, ExModule, PlaneUser } from "@plane/sdk";
import { getFormattedDate } from "@/jira";
import { getRandomColor } from "../helpers/strings";
import {
  TExtractedRecord,
  TFlatfileRecord,
  TFlatfileEntity,
  TExtractedIssue,
  TExtractedCycle,
  TExtractedIssueType,
  TExtractedUser,
  TExtractedModule,
} from "../types";

/**
 * @function extractRecord
 * @description Extracts and transforms a Flatfile record into the application's record format
 * @param {RecordWithLinks} record - The raw record from Flatfile API
 * @returns {Promise<TExtractedRecord>} Extracted and transformed record
 * @throws {Error} If record transformation fails
 */
export const extractRecord = (record: RecordWithLinks): TExtractedRecord => {
  const importRecord = record as unknown as TFlatfileRecord;
  const extractedRecord: TExtractedRecord = {};

  for (const [key, value] of Object.entries(importRecord.values)) {
    const keyName = key as keyof TExtractedRecord;
    extractedRecord[keyName] = value.value as any;
  }

  return extractedRecord;
};

/**
 * Transform an extracted issue to Plane issue format
 * @param issue Extracted issue to transform
 * @returns Transformed issue in Plane format
 */
export const transformIssue = (issue: TExtractedIssue): Partial<ExIssue> => {
  const transformedIssue: Partial<ExIssue> = {
    name: issue.title,
    description_html: issue.description === "" ? "<p></p>" : issue.description,
    external_id: issue.id, // Using title as external_id since Flatfile doesn't provide one
    external_source: "FLATFILE",
    type_id: issue.issue_type ?? "",
    created_by: issue.created_by ?? "",
    start_date: issue.start_date,
    target_date: issue.target_date,
    created_at: new Date(issue.created_at ?? Date.now()).toISOString(),
    priority: issue.priority === "" ? "none" : issue.priority,
    state: issue.state ?? "",
    assignees: issue.assignees ?? [],
    labels: issue.labels ?? [],
  };

  return transformedIssue;
};

/**
 * Transform a label string to Plane label format
 * @param label Label string to transform
 * @returns Transformed label in Plane format
 */
export const transformLabel = (label: string): Partial<ExIssueLabel> => ({
  name: label.trim(),
  color: getRandomColor(),
  external_id: label.trim().toLowerCase(),
  external_source: "FLATFILE",
});

/**
 * Transform a cycle string to Plane cycle format
 * @param cycle Cycle string to transform
 * @returns Transformed cycle in Plane format
 */
export const transformCycle = (cycle: TExtractedCycle): Partial<ExCycle> => ({
  name: cycle.name.trim(),
  external_id: cycle.id,
  external_source: "FLATFILE",
  issues: cycle.issues,
});

/**
 * Transform a module string to Plane module format
 * @param module Module string to transform
 * @returns Transformed module in Plane format
 */
export const transformModule = (module: TExtractedModule): Partial<ExModule> => ({
  name: module.name.trim(),
  external_id: module.id,
  external_source: "FLATFILE",
  issues: module.issues,
});

/**
 * Transform an issue type string to Plane issue type format
 * @param issueType Issue type string to transform
 * @returns Transformed issue type in Plane format
 */
export const transformIssueType = (issueType: TExtractedIssueType): Partial<ExIssueType> => ({
  name: issueType,
  is_active: true,
  external_id: issueType,
  external_source: "FLATFILE",
});

/**
 * Transform a user string to Plane user format
 * @param user User string to transform
 * @returns Transformed user in Plane format
 */
export const transformUser = (user: TExtractedUser): Partial<PlaneUser> => ({
  // Take the initials of the email and use it as the display name
  display_name: user.email.split("@")[0],
  email: user.email,
  role: 15,
});

/**
 * Transforms an array of extracted records into a Flatfile entity with deduplication
 * @param records Array of extracted records to transform
 * @returns Transformed Flatfile entity with unique entries
 */
export const extractFlatfileEntity = (records: TExtractedRecord[]): TFlatfileEntity[] => {
  const labels = new Set<string>();
  const cyclesMap = new Map<string, string[]>();
  const moduleMap = new Map<string, string[]>();

  const issueTypeSet = new Set<string>();
  const issueTypes: TExtractedIssueType[] = [];

  const issues: TExtractedIssue[] = [];

  const userSet = new Set<string>();
  const users: TExtractedUser[] = [];

  // Process each record
  for (const record of records) {
    // Create a unique issue id for the record
    const issueId = uuidv4();
    // Collect unique labels (case-insensitive)
    if (record.labels) {
      record.labels.forEach((label) => {
        label
          .split(";")
          .map((part) => part.trim().toLowerCase())
          .filter((part) => part.length > 0)
          .forEach((part) => labels.add(part));
      });
    }

    // Transform to issue (if title is unique)
    if (record.title) {
      const normalizedTitle = record.title.trim();
      if (normalizedTitle.length > 0) {
        if (record.issue_type) {
          if (!issueTypeSet.has(record.issue_type.trim())) {
            const issueType = record.issue_type.trim();
            issueTypeSet.add(issueType);
            issueTypes.push(issueType);
          }
        }

        issues.push({
          id: issueId,
          title: normalizedTitle,
          state: record.state?.trim() || "",
          priority: record.priority?.trim() || "",
          assignees: (record.assignees || []).map((assignee) => assignee.trim().split("@")[0]),
          created_by: record.created_by && record.created_by.trim().split("@")[0],
          issue_type: record.issue_type?.trim(),
          description: record.description?.trim() || "",
          labels: (record.labels || []).flatMap((label) => label.split(";").map((part) => part.trim())),
          start_date: record.start_date && getFormattedDate(record.start_date.trim()),
          target_date: record.target_date && getFormattedDate(record.target_date.trim()),
        });

        const associatedUsers = [
          ...(record.assignees || []).map((assignee) => assignee.trim()),
          ...(record.created_by ? [record.created_by.trim()] : []),
        ];

        if (associatedUsers.length !== 0) {
          associatedUsers.forEach((user) => {
            if (!userSet.has(user)) {
              userSet.add(user);
              users.push({
                id: uuidv4(),
                email: user,
              });
            }
          });
        }

        // Collect unique cycles (case-insensitive)
        if (record.cycle) {
          const normalizedCycle = record.cycle.trim().toLowerCase();
          if (normalizedCycle.length > 0) {
            const cycleIssues = cyclesMap.get(normalizedCycle) || [];
            cycleIssues.push(issueId);
            cyclesMap.set(normalizedCycle, cycleIssues);
          }
        }

        if (record.module) {
          const normalizedModule = record.module.trim().toLowerCase();
          if (normalizedModule.length > 0) {
            const moduleIssues = moduleMap.get(normalizedModule) || [];
            moduleIssues.push(issueId);
            moduleMap.set(normalizedModule, moduleIssues);
          }
        }
      }
    }
  }

  return [
    {
      labels: Array.from(labels),
      cycles: Array.from(cyclesMap.entries()).map(([name, issues]) => {
        const cycleId = uuidv4();
        return {
          id: cycleId,
          name,
          issues,
        };
      }),
      issues: issues.sort((a, b) => a.title.localeCompare(b.title)), // Sort issues by title
      issue_types: issueTypes,
      users: users,
      modules: Array.from(moduleMap.entries()).map(([name, issues]) => {
        const moduleId = uuidv4();
        return {
          id: moduleId,
          name,
          issues,
        };
      }),
    },
  ];
};
