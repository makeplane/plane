import { SQL, and, eq } from "drizzle-orm";
import { db } from "../config/db.config";
import { entityConnections, workspaceConnections } from "../schema/connection.schema";

export async function createWorkspaceConnection(data: typeof workspaceConnections.$inferInsert) {
  return await db.insert(workspaceConnections).values(data).returning();
}

export async function getWorkspaceConnectionById(id: string) {
  return await db.select().from(workspaceConnections).where(eq(workspaceConnections.id, id)).limit(1);
}

export async function getAllWorkspaceConnections(workspaceId: string) {
  return await db.select().from(workspaceConnections).where(eq(workspaceConnections.workspaceId, workspaceId));
}

export async function getWorkspaceConnectionByConnectionId(connectionId: string, source: string) {
  return await db
    .select()
    .from(workspaceConnections)
    .where(and(eq(workspaceConnections.connectionId, connectionId), eq(workspaceConnections.connectionType, source)))
    .limit(1);
}

export async function getWorkspaceConnections(workspaceId: string, type?: string, connectionId?: string) {
  const conditions: SQL[] = [eq(workspaceConnections.workspaceId, workspaceId)];

  if (type) {
    conditions.push(eq(workspaceConnections.connectionType, type));
  }

  if (connectionId) {
    conditions.push(eq(workspaceConnections.connectionId, connectionId));
  }

  return await db
    .select()
    .from(workspaceConnections)
    .where(and(...conditions));
}

export async function updateWorkspaceConnection(id: string, data: Partial<typeof workspaceConnections.$inferInsert>) {
  return await db
    .update(workspaceConnections)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workspaceConnections.id, id))
    .returning();
}

export async function deleteWorkspaceConnection(id: string) {
  return await db.delete(workspaceConnections).where(eq(workspaceConnections.id, id)).returning();
}

export async function createEntityConnection(data: typeof entityConnections.$inferInsert) {
  return await db.insert(entityConnections).values(data).returning();
}

export async function getEntityConnection(id: string) {
  return await db.select().from(entityConnections).where(eq(entityConnections.id, id)).limit(1);
}

export async function getEntityConnectionByEntityId(entityId: string) {
  return await db.select().from(entityConnections).where(eq(entityConnections.entityId, entityId)).limit(1);
}

export async function getEntityConnectionByWorkspaceAndProjectId(workspaceId: string, projectId?: string) {
  const conditions: SQL[] = [eq(entityConnections.workspaceId, workspaceId)];

  if (projectId) {
    conditions.push(eq(entityConnections.projectId, projectId));
  }

  return await db
    .select()
    .from(entityConnections)
    .where(and(...conditions));
}

export async function getEntityConnectionByEntitySlug(workspaceId: string, projectId: string, entitySlug: string) {
  return await db
    .select()
    .from(entityConnections)
    .where(
      and(
        eq(entityConnections.workspaceId, workspaceId),
        eq(entityConnections.projectId, projectId),
        eq(entityConnections.entitySlug, entitySlug)
      )
    )
    .limit(1);
}

export async function getAllEntityConnections(workspaceId: string, projectId: string) {
  return await db
    .select()
    .from(entityConnections)
    .where(and(eq(entityConnections.workspaceId, workspaceId), eq(entityConnections.projectId, projectId)));
}

// Update
export async function updateEntityConnection(id: string, data: Partial<typeof entityConnections.$inferInsert>) {
  return await db
    .update(entityConnections)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(entityConnections.id, id))
    .returning();
}

// Delete
export async function deleteEntityConnection(id: string) {
  return await db.delete(entityConnections).where(eq(entityConnections.id, id)).returning();
}

export async function deleteEntityConnectionByWorkspaceConnectionId(workspaceConnectionId: string) {
  return await db
    .delete(entityConnections)
    .where(eq(entityConnections.workspaceConnectionId, workspaceConnectionId))
    .returning();
}
