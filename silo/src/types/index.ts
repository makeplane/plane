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


export type PlaneOAuthTokenOptions = {
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
  code?: string;
  code_verifier?: string;
  grant_type?: "authorization_code" | "client_credentials";
  refresh_token?: string;
};


export type PlaneOAuthTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token: string;
};
