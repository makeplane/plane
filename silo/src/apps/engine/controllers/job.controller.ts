/*
 * A job is a fundamental unit of work in the server, a job represent a task
 * that needs to be done from the importers or integrations present. A job and
 * the job configuration is stored in the database and when the job is run, the
 * same is injected inside the worker, which makes use of the job configuration
 * and performs the task
 */

import { Controller, Delete, Get, Post, Put } from "@/lib";
import {
  createJob,
  createJobConfig,
  deleteJob,
  getCredentialsByTargetToken,
  getJobById,
  getJobByWorkspaceId,
  getJobByWorkspaceIdAndSource,
  updateJob,
} from "@/db/query";
import { Request, Response } from "express";
import taskManager from "@/apps/engine/worker";
import { TSyncServices } from "@silo/core";

@Controller("/jobs")
export class JobController {
  @Post("/")
  async createJob(req: Request, res: Response) {
    try {
      if (!req.body.workspace_id) {
        res.status(400).json({ message: "Workspace ID is required" });
        return;
      }
      const job = await createJob({
        ...req.body,
      });
      res.status(201).json(job);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Get("/")
  async getJobs(req: Request, res: Response) {
    try {
      // check for the params, if empty then return error
      if (!req.query) {
        res.status(400).json({ message: "Invalid query" });
        return;
      }
      // Check for the query params and get the jobs according to the functions
      // associated with the query params
      if (req.query.id) {
        const job = await getJobById(req.query.id as string);
        res.status(200).json(job);
        return;
      } else {
        // Get the api token from the headers and check if the token is valid
        const token = req.headers["x-api-key"];
        if (!token) {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }
        // Get the credentials for the token
        const credentials = await getCredentialsByTargetToken((token as string).trim());

        if (credentials.length == 0) {
          res.status(400).json({ message: "No migration jobs available for this token" });
          return;
        }

        const targetCredentials = credentials[0];
        if (targetCredentials.workspace_id == null) {
          res.status(200).json([]);
          return;
        }
        // Find the jobs based on the workspace ID of the credentials
        let jobs = {};
        if (req.query.source) {
          jobs = await getJobByWorkspaceIdAndSource(targetCredentials.workspace_id, req.query.source as TSyncServices);
        } else {
          jobs = await getJobByWorkspaceId(targetCredentials.workspace_id);
        }
        res.status(200).json(jobs);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Put("/:id")
  async updateJob(req: Request, res: Response) {
    try {
      if (req.body.start_time) {
        req.body.start_time = new Date(req.body.start_time);
      }

      if (req.body.end_time) {
        req.body.end_time = new Date(req.body.end_time);
      }

      const job = await updateJob(req.params.id, req.body);

      if (job) {
        res.status(200).json(job);
      } else {
        res.status(404).json({ message: "Job not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Delete("/:id")
  async deleteJob(req: Request, res: Response) {
    try {
      const job = await deleteJob(req.params.id);
      if (job) {
        res.status(200).json({ message: "Job deleted successfully" });
      } else {
        res.status(404).json({ message: "Job not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Post("/run")
  async runJob(req: Request, res: Response) {
    try {
      const body = req.body;
      if (
        !body ||
        !body.jobId ||
        body.jobId == "" ||
        body.jobId == null ||
        body.migrationType == "" ||
        body.migrationType == null
      ) {
        res.status(400).json({
          message: "Invalid request, expecting (jobId) & (migrationType) to be passed",
        });
        return;
      }

      // Get the job from the given job id
      const jobs = await getJobById(body.jobId);
      if (jobs.length == 0) {
        res.status(404).json({
          message: `No job with id ${body.jobId} is available to run, please create one.`,
        });
        return;
      }

      const job = jobs[0];
      // If the job is not finished or error, just send 400 OK, and don't do
      // anything
      if (job.status && job.status != "FINISHED" && job.status != "ERROR") {
        res.status(400).json({ message: "Job already in progress, can't instantiate again" });
        return;
      }
      // Check if the config is already present, for the particular job or not
      if (!job.config || job.migration_type == null) {
        res.status(400).json({
          message: "Config for the requested job is not found, make sure to create a config before initiating a job",
        });
        return;
      }

      await taskManager.registerTask(
        {
          route: job.migration_type.toLowerCase(),
          jobId: job.id,
          type: "initiate",
        },
        {}
      );
      res.status(200).json({ message: "Job initiated successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

@Controller("/job-configs")
export class JobConfigController {
  @Post("/")
  async createJobConfig(req: Request, res: Response) {
    try {
      const jobConfig = await createJobConfig(req.body);
      res.status(201).json(jobConfig);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
