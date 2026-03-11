/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// import { Simplify } from "type-fest";
import { z } from "zod";
import type { ExIssue, ExIssueActivity, ExIssueComment, ExIssuePropertyValue, TWorklog } from "@plane/sdk";
import type { TWorkspaceConnection, TWorkspaceEntityConnection } from "@plane/types";

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
  activities?: Partial<ExIssueActivity>[];
  worklogs?: Partial<TWorklog>[];
  subscribers?: string[];
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
