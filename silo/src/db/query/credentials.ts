import { db } from "@/db/config/db.config";
import { and, eq } from "drizzle-orm";
import * as schema from "../schema";
import { Credentials } from "@/types";
import { env } from "@/env";
import e from "cors";

/* ------------------- Create Job ------------------- */
// Create the job based on the data that defined
export const createOrUpdateCredentials = async (
  workspaceId: string,
  userId: string,
  credentials: Partial<Credentials> & { source: string }
) => {
  // Get the existing active credentials and update it
  const existingCredentials = await db
    .select()
    .from(schema.credentials)
    .where(
      and(
        eq(schema.credentials.user_id, userId),
        eq(schema.credentials.workspace_id, workspaceId),
        eq(schema.credentials.source, credentials.source),
        eq(schema.credentials.is_active, true)
      )
    );

  // If the credentials already exist, update them
  if (existingCredentials.length > 0) {
    const [updatedCredentials] = await db
      .update(schema.credentials)
      .set(credentials)
      .where(
        and(
          eq(schema.credentials.workspace_id, workspaceId),
          eq(schema.credentials.user_id, userId),
          eq(schema.credentials.source, credentials.source),
          eq(schema.credentials.is_active, true)
        )
      )
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
  const conditions = [
    eq(schema.credentials.user_id, userId),
    eq(schema.credentials.workspace_id, workspaceId),
    eq(schema.credentials.source, source),
    eq(schema.credentials.is_active, true),
  ];

  if (
    (source === "JIRA" && env.JIRA_OAUTH_ENABLED === "0") ||
    (source === "LINEAR" && env.LINEAR_OAUTH_ENABLED === "0") ||
    (source === "ASANA" && env.ASANA_OAUTH_ENABLED === "0")
  ) {
    conditions.push(eq(schema.credentials.isPAT, true));
  }

  const credentials = await db
    .select()
    .from(schema.credentials)
    .where(and(...conditions));

  return credentials;
};

export const getCredentialsByOnlyWorkspaceId = async (workspaceId: string, source: string) => {
  const conditions = [
    eq(schema.credentials.workspace_id, workspaceId),
    eq(schema.credentials.source, source),
    eq(schema.credentials.is_active, true),
  ];

  if (
    (source === "JIRA" && env.JIRA_OAUTH_ENABLED === "0") ||
    (source === "LINEAR" && env.LINEAR_OAUTH_ENABLED === "0") ||
    (source === "ASANA" && env.ASANA_OAUTH_ENABLED === "0")
  ) {
    conditions.push(eq(schema.credentials.isPAT, true));
  }

  const credentials = await db
    .select()
    .from(schema.credentials)
    .where(and(...conditions));
  return credentials;
};

export const getCredentialsByTargetToken = async (targetToken: string) => {
  try {
    const credentials = await db
      .select()
      .from(schema.credentials)
      .where(and(eq(schema.credentials.target_access_token, targetToken), eq(schema.credentials.is_active, true)));

    return credentials;
  } catch (error) {
    console.error("Error getting credentials by target token", error);
    return [];
  }
};

export const deleteCredentialsBySourceToken = async (sourceToken: string) => {
  await db.delete(schema.credentials).where(eq(schema.credentials.source_access_token, sourceToken));
};

export const deleteCredentialsForWorkspace = async (workspaceId: string, source: string) => {
  await db
    .delete(schema.credentials)
    .where(and(eq(schema.credentials.workspace_id, workspaceId), eq(schema.credentials.source, source)));
};

export const getCredentialsBySourceToken = async (sourceToken: string) => {
  const credentials = await db
    .select()
    .from(schema.credentials)
    .where(and(eq(schema.credentials.source_access_token, sourceToken), eq(schema.credentials.is_active, true)));

  return credentials;
};

export const getCredentialsById = async (id: string) => {
  const credentials = await db.select().from(schema.credentials).where(eq(schema.credentials.id, id));

  return credentials;
};

// verifying and updating the external the api token
export const verifyAndUpdateTargetToken = async (
  workspaceId: string,
  userId: string,
  source: string,
  targetToken: string
) => {
  const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, source);

  if (credentials.length === 0) throw new Error("Credentials not found");
  if (credentials[0].target_access_token === targetToken) return;

  await db
    .update(schema.credentials)
    .set({ target_access_token: targetToken })
    .where(
      and(
        eq(schema.credentials.workspace_id, workspaceId),
        eq(schema.credentials.user_id, userId),
        eq(schema.credentials.source, source)
      )
    );
};

// deactivating credentials based on workspaceId, userId, and source
export const deactivateCredentials = async (workspaceId: string, userId: string, source: string) => {
  await db
    .update(schema.credentials)
    .set({ is_active: false })
    .where(
      and(
        eq(schema.credentials.workspace_id, workspaceId),
        eq(schema.credentials.user_id, userId),
        eq(schema.credentials.source, source)
      )
    );
};
