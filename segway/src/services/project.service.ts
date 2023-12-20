import { eq, sql } from "drizzle-orm";
import { DatabaseSingleton } from "../db/singleton";
import { projectMembers, projects, states } from "../db/slack.schema";

export class ProjectService {
  async getProjectsForWorkspace(workspaceId: string) {
    const db = DatabaseSingleton.getInstance().db;
    if (!db) {
      throw new Error("Database not found");
    }

    const selectedProjects = db
      .select({
        name: projects.name,
        id: projects.id,
      })
      .from(projects)
      .where(sql`${projects.workspaceId} = ${workspaceId}`);

    return selectedProjects;
  }

  async getProjectStates(projectId: string) {
    const db = DatabaseSingleton.getInstance().db;
    if (!db) {
      throw new Error("Database not found");
    }
    const projectStates = await db.query.states.findMany({
      where: eq(states.projectId, projectId),
    });

    return projectStates;
  }

  async getProjectMembers(projectId: string) {
    const db = DatabaseSingleton.getInstance().db;
    if (!db) {
      throw new Error("Database not found");
    }

    try {
      const members = await db.query.projectMembers.findMany({
        where: eq(projectMembers.projectId, projectId),
        with: { member: true },
      });

      return members;
    } catch (error) {
      throw new Error("Database not found");
    }
  }
}
