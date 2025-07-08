import { v4 as uuidv4 } from "uuid";
import { PlanePageEntity } from "@plane/etl/core";
import { TImportJob } from "@plane/types";
import { celeryProducer } from "@/worker";
import { getCredentialsForMigration } from "./helpers";

export class PagesMigrator {
  static async migrate(job: TImportJob, data: PlanePageEntity): Promise<void> {
    const credentials = await getCredentialsForMigration(job);
    const { pages } = data;

    await celeryProducer.registerTask(
      {
        pages
      },
      job.workspace_slug,
      job.project_id,
      job.id,
      credentials.user_id,
      uuidv4(),
      "plane.bgtasks.data_import_task.import_data"
    );
    return;
  }
}
