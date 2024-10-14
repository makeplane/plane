import { credentials } from "@/db/schema";
import { z } from "zod";

export const taskSchema = z.object({
  route: z.string(),
  jobId: z.string(),
  type: z.string(),
});

export type TaskHeaders = z.infer<typeof taskSchema>;

export abstract class TaskHandler {
  abstract handleTask(headers: TaskHeaders, data: any): Promise<boolean>;
}

export type Credentials = typeof credentials.$inferInsert;
