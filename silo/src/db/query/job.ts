import { db } from "@/db/config/db.config";
import { and, eq, desc } from "drizzle-orm";
import * as schema from "../schema";
import { TImporterKeys, TIntegrationKeys } from "@silo/core";

/* ------------------- Create Job ------------------- */
// Create the job based on the data that defined
export const createJob = async (jobData: any) => {
  const [newJob] = await db.insert(schema.jobs).values(jobData).returning({ insertedId: schema.jobs.id });
  return newJob;
};

/* --------------------- Get Job --------------------- */
export const getJobById = async (id: string) => {
  const jobs = await db.select().from(schema.jobs).where(eq(schema.jobs.id, id));

  const result = jobs.map(async (job) => {
    const [jobConfig] = await db
      .select()
      .from(schema.jobConfigs)
      .where(eq(schema.jobConfigs.id, job.config as any));
    return { ...job, config: jobConfig };
  });

  return await Promise.all(result);
};

// Fetch the job and jobconfig from the given workspaceslug
export const getJobByWorkspaceIdAndSource = async (workspaceId: string, source: TImporterKeys & TIntegrationKeys) => {
  // Get the job with the workspace slug
  const jobs = await db
    .select()
    .from(schema.jobs)
    .where(and(eq(schema.jobs.workspace_id, workspaceId), eq(schema.jobs.migration_type, source)))
    .orderBy(desc(schema.jobs.created_at));

  const result = jobs.map(async (job) => {
    const [jobConfig] = await db
      .select()
      .from(schema.jobConfigs)
      .where(eq(schema.jobConfigs.id, job.config as any));
    return { ...job, config: jobConfig };
  });

  return await Promise.all(result);
};

// Fetch the job and jobconfig from the given workspaceslug
export const getJobByWorkspaceId = async (workspaceId: string) => {
  // Get the job with the workspace slug
  const jobs = await db.select().from(schema.jobs).where(eq(schema.jobs.workspace_id, workspaceId));

  const result = jobs.map(async (job) => {
    const [jobConfig] = await db
      .select()
      .from(schema.jobConfigs)
      .where(eq(schema.jobConfigs.id, job.config as any));
    return { ...job, config: jobConfig };
  });

  return await Promise.all(result);
};

// Fetch the job and jobconfig from the given workspaceslug and projectid
export const getJobByProjectId = async (workspaceId: string, projectId: string) => {
  // Get the job with both workspaceslug and projectid
  const jobs = await db
    .select()
    .from(schema.jobs)
    .where(and(eq(schema.jobs.workspace_id, workspaceId), eq(schema.jobs.project_id, projectId)));

  const result = jobs.map(async (job) => {
    const [jobConfig] = await db
      .select()
      .from(schema.jobConfigs)
      .where(eq(schema.jobConfigs.id, job.config as any));
    return { ...job, config: jobConfig };
  });

  return await Promise.all(result);
};

/* --------------------- Update Job --------------------- */
// Fetch the job and jobconfig from the given workspaceslug and projectid
export const updateJob = async (id: string, jobData: any) => {
  return await db.update(schema.jobs).set(jobData).where(eq(schema.jobs.id, id));
};

export const deleteJob = async (id: string) => {
  return await db.delete(schema.jobs).where(eq(schema.jobs.id, id));
};

/* --------------------- Create Job Config --------------------- */
// Creates the job config based on the data that defined
export const createJobConfig = async (configData: any) => {
  const [newJobConfig] = await db
    .insert(schema.jobConfigs)
    .values(configData)
    .returning({ insertedId: schema.jobConfigs.id });
  return newJobConfig;
};
