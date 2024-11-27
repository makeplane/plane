import { entityConnections, workspaceConnections } from "@/db/schema/connection.schema";
import { z } from "zod";
import { Simplify } from "type-fest";
import { credentials } from "@/db/schema";

export const taskSchema = z.object({
  route: z.string(),
  jobId: z.string(),
  type: z.string(),
});

export type TaskHeaders = z.infer<typeof taskSchema>;

export abstract class TaskHandler {
  abstract handleTask(headers: TaskHeaders, data: any): Promise<boolean>;
}

export type WorkspaceConnection<T extends z.ZodType> = Simplify<
  Omit<typeof workspaceConnections.$inferInsert, "config"> & {
    config: z.infer<T>;
  }
>;

export type EntityConnection<T extends z.ZodType> = Simplify<
  Omit<typeof entityConnections.$inferInsert, "config"> & {
    config: z.infer<T>;
  }
>;

export function verifyWorkspaceConnection<T extends z.ZodType>(
  schema: T,
  data: WorkspaceConnection<T>
): WorkspaceConnection<T> {
  const parsedConfig = schema.parse(data.config);
  return { ...data, config: parsedConfig };
}

export function verifyEntityConnection<T extends z.ZodType>(schema: T, data: EntityConnection<T>): EntityConnection<T> {
  const parsedConfig = schema.parse(data.config);
  return { ...data, config: parsedConfig };
}
export type Credentials = typeof credentials.$inferInsert;
