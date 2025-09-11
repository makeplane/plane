import { Request, Response } from "express";
import { E_IMPORTER_KEYS, E_JOB_STATUS } from "@plane/etl/core";
import { createOrUpdateCredentials } from "@/helpers/credential";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, Post } from "@/lib";
import { getAPIClientInternal } from "@/services/client";
import { importTaskManger } from "@/worker";
import { EZipDriverType } from "../drivers";

const apiClient = getAPIClientInternal();

@Controller("/api/zip-importer")
export class NotionController {
  @Post("/:provider/credentials/save")
  async saveCredentials(req: Request, res: Response) {
    try {
      const { workspaceId, userId, externalApiToken } = req.body;
      const { provider } = req.params;

      if (!workspaceId || !userId || !externalApiToken) {
        return res.status(400).json({
          error: "Missing required parameters: workspaceId, userId or externalApiToken",
        });
      }

      await createOrUpdateCredentials(workspaceId, userId, provider.toUpperCase() as E_IMPORTER_KEYS, {
        source: provider.toUpperCase(),
        target_access_token: externalApiToken,
        workspace_id: workspaceId,
        user_id: userId,
      });

      return res.sendStatus(201);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/:provider/start-import")
  async startImport(req: Request, res: Response) {
    try {
      const { workspaceId, userId, fileKey, fileName } = req.body;
      const { provider } = req.params;

      if (!workspaceId || !userId || !fileKey) {
        return res.status(400).json({ error: "Missing required parameters: workspaceId, userId or fileKey" });
      }

      const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
        workspace_id: workspaceId,
        user_id: userId,
        source: provider.toUpperCase() as EZipDriverType,
      });

      if (!credentials.length) {
        return res.status(400).json({ error: "Credentials not found" });
      }

      const credential = credentials[0];

      // Create job for the import
      const job = await apiClient.importJob.createImportJob({
        status: E_JOB_STATUS.CREATED,
        credential_id: credential.id,
        initiator_id: userId,
        workspace_id: workspaceId,
        source: provider.toUpperCase() as EZipDriverType,
        config: {
          fileId: fileKey,
          fileName: fileName,
        },
      });

      await apiClient.importReport.updateImportReport(job.report_id, {
        total_batch_count: 2,
      });

      await importTaskManger.registerTask(
        {
          route: job.source.toLowerCase(),
          jobId: job.id,
          type: "initiate",
        },
        {
          type: provider.toUpperCase() as EZipDriverType,
        }
      );

      return res.status(200).json({
        success: true,
        message: "Upload confirmed. Import process will begin shortly.",
      });
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }
}
