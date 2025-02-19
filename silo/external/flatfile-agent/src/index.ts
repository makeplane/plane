import api from "@flatfile/api";
import { FlatfileEvent, FlatfileListener } from "@flatfile/listener";
import { recordHook } from "@flatfile/plugin-record-hook";
import { importLandingContent } from "./documents/landing";
import { uploadFileStage } from "./documents/upload";

export default function flatfileEventListener(listener: FlatfileListener) {
  // Add workbook configuration when the space is created
  listener.namespace(["space:flatfile_import"], (red: FlatfileListener) => {
    // Add record hook for email validation

    red.on("job:ready", { job: "space:configure" }, async (event: FlatfileEvent) => {
      const { spaceId, jobId } = event.context;
      try {
        await api.jobs.ack(jobId, {
          info: "Gettin started.",
          progress: 10,
        });

        await api.documents.create(spaceId, {
          title: "Getting Started",
          body: importLandingContent,
          actions: [
            {
              operation: "startImport",
              mode: "foreground",
              label: "Start Import",
              description: "Start importing data from Flatfile",
              primary: true,
            },
          ],
        });

        await api.jobs.complete(jobId, {
          outcome: {
            acknowledge: false,
          },
        });
      } catch (error) {
        console.error("Error:", error);

        await api.jobs.fail(jobId, {
          outcome: {
            message: "Creating a Space encountered an error. See Event Logs.",
            acknowledge: true,
          },
        });
      }
    });

    red.use(
      recordHook("plane_issues", (record) => {
        // Validate email
        const validateEmail = (key: string, text: string) => {
          const isValidEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(text);
          if (!isValidEmail) {
            record.addError(key, "Please enter a valid email address");
          }
        };

        const validateDate = (key: string, text: string) => {
          const isDate = !isNaN(Date.parse(text));
          if (!isDate) {
            record.addError(key, "Please enter a valid date");
          }
        };

        // Validate email
        const created_by = record.get("created_by");
        const assignees = record.get("assignees");

        if (created_by && typeof created_by === "string") {
          validateEmail("created_by", created_by);
        }

        if (assignees && typeof assignees === "object") {
          assignees.forEach((assignee: string) => validateEmail("assignees", assignee as string));
        }

        // Validate date
        const start_date = record.get("start_date");
        const target_date = record.get("target_date");

        if (start_date && typeof start_date === "string") {
          validateDate("start_date", start_date);
        }

        if (target_date && typeof target_date === "string") {
          validateDate("target_date", target_date);
        }
      })
    );

    red.on("job:ready", { job: "document:startImport" }, async (event: FlatfileEvent) => {
      const { spaceId, jobId } = event.context;
      try {
        await api.jobs.ack(jobId, {
          info: "Gettin started.",
          progress: 10,
        });

        const space = await api.spaces.get(spaceId);
        const workbook = await api.workbooks.create({
          ...space.data.metadata.workbookConfig,
          namespace: event.namespace[0],
        });
        const documents = await api.documents.list(spaceId);

        if (workbook.data.sheets && workbook.data.sheets[0]) {
          const content = uploadFileStage(workbook.data.sheets[0].id, workbook.data.id);

          await api.documents.update(spaceId, documents.data[0].id, {
            title: "Getting Started",
            body: content,
            actions: [
              {
                operation: "startImport",
                mode: "foreground",
                label: "Start Import",
                description: "Start importing data from Flatfile",
                primary: true,
              },
            ],
          });

          await api.jobs.complete(jobId, {
            outcome: {
              acknowledge: false,
            },
          });
        }
      } catch (error) {
        console.error("Error:", error);

        await api.jobs.fail(jobId, {
          outcome: {
            acknowledge: false,
          },
        });
      }
    });

    red.on("job:ready", { job: "workbook:submitAction" }, async (event: FlatfileEvent) => {
      const { jobId, workbookId } = event.context;

      // Acknowledge the job
      try {
        await api.jobs.ack(jobId, {
          info: "Starting job to submit action to webhook.site",
          progress: 10,
        });

        // Collect all Sheet and Record data from the Workbook
        const { data: sheets } = await api.sheets.list({ workbookId });
        const records: { [name: string]: any } = {};
        for (const [index, element] of sheets.entries()) {
          records[`Sheet[${index}]`] = await api.records.get(element.id);
        }

        // Otherwise, complete the job
        await api.jobs.complete(jobId, {
          outcome: {
            message: `Data was successfully submitted`,
          },
        });
      } catch (error) {
        // If an error is thrown, fail the job
        console.log(`webhook.site[error]: ${JSON.stringify(error, null, 2)}`);
      }
    });
  });
}
