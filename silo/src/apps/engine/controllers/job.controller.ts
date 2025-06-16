/*
 * A job is a fundamental unit of work in the server, a job represent a task
 * that needs to be done from the importers or integrations present. A job and
 * the job configuration is stored in the database and when the job is run, the
 * same is injected inside the worker, which makes use of the job configuration
 * and performs the task
 */

import { Request, Response } from "express";

import { TImporterKeys, TIntegrationKeys } from "@plane/etl/core";
import { resetJobIfStarted } from "@/helpers/job";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, Get, Post, Put, useValidateUserAuthentication } from "@/lib";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { importTaskManger } from "@/worker";

const client = getAPIClient();

@Controller("/api/jobs")
export class JobController {
  @Post("/")
  @useValidateUserAuthentication()
  async createJob(req: Request, res: Response) {
    try {
      if (!req.body.workspace_id) {
        res.status(400).json({ message: "Workspace ID is required" });
        return;
      }
      const job = await client.importJob.createImportJob({
        ...req.body,
      });

      res.status(201).json(job);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/")
  @useValidateUserAuthentication()
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
        const job = await client.importJob.getImportJob(req.query.id as string);
        res.status(200).json(job);
        return;
      } else if (req.query.workspaceId) {
        // Find the jobs based on the workspace ID of the credentials
        let jobs = [];
        if (req.query.source) {
          jobs = await client.importJob.listImportJobs({
            workspace_id: req.query.workspaceId as string,
            source: req.query.source as TImporterKeys & TIntegrationKeys,
          });
        } else {
          jobs = await client.importJob.listImportJobs({
            workspace_id: req.query.workspaceId as string,
          });
        }

        // remove relation_map and config from the jobs
        jobs = jobs.map((job) => {
          const { relation_map, ...rest } = job;
          return rest;
        });

        res.status(200).json(jobs);
      } else {
        responseHandler(res, 400, { message: "Invalid query" });
      }
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Put("/:id")
  @useValidateUserAuthentication()
  async updateJob(req: Request, res: Response) {
    try {
      if (req.body.start_time) {
        req.body.start_time = new Date(req.body.start_time);
      }

      if (req.body.end_time) {
        req.body.end_time = new Date(req.body.end_time);
      }

      const job = await client.importJob.updateImportJob(req.params.id, req.body);

      if (job) {
        res.status(200).json(job);
      } else {
        res.status(404).json({ message: "Job not found" });
      }
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/cancel")
  @useValidateUserAuthentication()
  async cancelJob(req: Request, res: Response) {
    try {
      const body = req.body;
      if (!body || !body.jobId || body.jobId == "" || body.jobId == null) {
        res.status(400).json({
          message: "Invalid request, expecting (jobId) to be passed",
        });
        return;
      }

      // Get the job from the given job id
      const job = await client.importJob.getImportJob(body.jobId);
      if ((job.status && job.status === "FINISHED") || job.status === "ERROR") {
        res.status(400).json({ message: "Job already finished or errored out, can't cancel" });
        return;
      }

      await client.importJob.updateImportJob(body.jobId, {
        status: "CANCELLED",
        cancelled_at: new Date().toISOString(),
      });
      res.status(200).json({ message: "Job cancelled successfully" });
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/:id/finished")
  async updateJobFinished(req: Request, res: Response) {
    try {
      const jobId = req.params.id;
      const phase = req.body.phase;
      const isLastBatch = req.body.isLastBatch;
      // Look up for the job to ensure the job exists and is valid
      const job = await client.importJob.getImportJob(jobId);
      if (!job) return res.status(400).json({ message: "Job not found" });

      // Dispatch an event for the importer to handle any sort of post job processing
      logger.info(`[${job.id}] Dispatching job finished event for ${job.source} with phase ${phase} and isLastBatch ${isLastBatch}`);
      await importTaskManger.registerTask(
        {
          route: job.source.toLowerCase(),
          jobId: job.id,
          type: "finished",
        },
        { phase, isLastBatch }
      );
      res.status(200).json({ message: "Job updated successfully" });
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/run")
  @useValidateUserAuthentication()
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
      const job = await client.importJob.getImportJob(body.jobId);
      // If the job is not finished or error, just send 400 OK, and don't do
      // anything
      if (
        job.status &&
        job.status != "CREATED" &&
        job.status != "FINISHED" &&
        job.status != "ERROR" &&
        job.status != "CANCELLED"
      ) {
        res.status(400).json({ message: "Job already in progress, can't instantiate again" });
        return;
      }
      // Check if the config is already present, for the particular job or not
      if (!job.config || job.source == null) {
        res.status(400).json({
          message: "Config for the requested job is not found, make sure to create a config before initiating a job",
        });
        return;
      }

      await client.importJob.updateImportJob(job.id, {
        status: "CREATED",
        cancelled_at: null,
        error_metadata: undefined,
      });

      await resetJobIfStarted(job);

      await importTaskManger.registerTask(
        {
          route: job.source.toLowerCase(),
          jobId: job.id,
          type: "initiate",
        },
        {}
      );

      res.status(200).json({ message: "Job initiated successfully" });
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }
}
