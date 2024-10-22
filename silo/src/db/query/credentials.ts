import { db } from "@/db/config/db.config";
import { and, eq } from "drizzle-orm";
import * as schema from "../schema";

/* ------------------- Create Job ------------------- */
// Create the job based on the data that defined
export const createOrUpdateCredentials = async (workspaceId: string, userId: string, credentials: any) => {
  // Check if the credentials already exist
  const existingCredentials = await db
    .select()
    .from(schema.credentials)
    .where(
      and(
        eq(schema.credentials.user_id, userId),
        eq(schema.credentials.workspace_id, workspaceId),
        eq(schema.credentials.source, credentials.source)
      )
    );

  // If the credentials already exist, update them
  if (existingCredentials.length > 0) {
    const [updatedCredentials] = await db
      .update(schema.credentials)
      .set(credentials)
      .where(eq(schema.credentials.workspace_id, workspaceId))
      .returning();
    return updatedCredentials;
  } else {
    const [newCredentials] = await db
      .insert(schema.credentials)
      .values({
        workspace_id: workspaceId,
        user_id: userId,
        ...credentials,
      })
      .returning();
    return newCredentials;
  }
};

export const createCredentials = async (workspaceId: string, credentials: any) => {
  const [newCredentials] = await db
    .insert(schema.credentials)
    .values({
      workspace_id: workspaceId,
      ...credentials,
    })
    .returning({ insertedId: schema.jobs.id });
  return newCredentials;
};

export const getCredentialsByWorkspaceId = async (workspaceId: string, userId: string, source: string) => {
  const credentials = await db
    .select()
    .from(schema.credentials)
    .where(
      and(
        eq(schema.credentials.user_id, userId),
        eq(schema.credentials.workspace_id, workspaceId),
        eq(schema.credentials.source, source)
      )
    );

  return credentials;
};

export const getCredentialsByOnlyWorkspaceId = async (workspaceId: string, source: string) => {
  const credentials = await db
    .select()
    .from(schema.credentials)
    .where(and(eq(schema.credentials.workspace_id, workspaceId), eq(schema.credentials.source, source)));
  return credentials;
};

export const getCredentialsByTargetToken = async (targetToken: string) => {
  try {
    const credentials = await db
      .select()
      .from(schema.credentials)
      .where(eq(schema.credentials.target_access_token, targetToken));

    return credentials;
  } catch (error) {
    console.error("Error getting credentials by target token", error);
    return [];
  }
};

export const deleteCredentialsBySourceToken = async (sourceToken: string) => {
  await db.delete(schema.credentials).where(eq(schema.credentials.source_access_token, sourceToken));
};
