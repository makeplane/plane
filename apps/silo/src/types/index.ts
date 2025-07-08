// import { Simplify } from "type-fest";
import { z } from "zod";
import { ExIssue, ExIssueComment, ExIssuePropertyValue } from "@plane/sdk";
import { TWorkspaceConnection, TWorkspaceEntityConnection } from "@plane/types";

export const taskSchema = z.object({
  route: z.string(),
  jobId: z.string(),
  type: z.string(),
});

export type TaskHeaders = z.infer<typeof taskSchema>;

export abstract class TaskHandler {
  abstract handleTask(headers: TaskHeaders, data: any): Promise<boolean>;
}

// export type WorkspaceConnection<T extends z.ZodType> = Simplify<
//   Omit<typeof workspaceConnections.$inferInsert, "config"> & {
//     config: z.infer<T>;
//   }
// >;
//
// export type EntityConnection<T extends z.ZodType> = Simplify<
//   Omit<typeof entityConnections.$inferInsert, "config"> & {
//     config: z.infer<T>;
//   }
// >;

export function verifyWorkspaceConnection<T extends z.ZodType>(schema: T, data: TWorkspaceConnection<T>) {
  const parsedConfig = schema.parse(data.config);
  return { ...data, config: parsedConfig };
}

export function verifyEntityConnection<T extends z.ZodType>(schema: T, data: TWorkspaceEntityConnection<T>) {
  const parsedConfig = schema.parse(data.config);
  return { ...data, config: parsedConfig };
}

export function verifyEntityConnections<T extends z.ZodType>(schema: T, dataArray: TWorkspaceEntityConnection<T>[]) {
  return dataArray.map((data) => {
    const parsedConfig = schema.parse(data.config);
    return { ...data, config: parsedConfig };
  });
}

// export type Credentials = typeof credentials.$inferInsert;

export type BulkIssuePayload = ExIssue & {
  comments: ExIssueComment[];
  cycles: string[];
  modules: string[];
  file_assets: string[];
  issue_property_values: {
    id: string;
    values: ExIssuePropertyValue;
  }[];
};

export interface APIErrorResponse {
  error: string;
  status: number;
}

export type ClientOptions = {
  baseURL: string;
  hmacPrivateKey: string;
  serviceName: string;
};