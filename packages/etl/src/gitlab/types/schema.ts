import z from "zod";

export type MergeRequestEvent =
  | "DRAFT_MR_OPENED"
  | "MR_OPENED"
  | "MR_REVIEW_REQUESTED"
  | "MR_READY_FOR_MERGE"
  | "MR_MERGED"
  | "MR_CLOSED";

const exStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.literal("to_be_created").optional(),
});

export const gitlabWorkspaceConnectionSchema = z.object({});

export const gitlabEntityConnectionSchema = z.object({
  states: z.object({
    mergeRequestEventMapping: z.record(z.custom<MergeRequestEvent>(), exStateSchema),
  }).optional(),
});
