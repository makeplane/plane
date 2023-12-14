// mq
import { ConsumeMessage } from "amqplib";
// base worker
import { BaseWorker } from "./base.worker";
// uuid
import { v4 as uuidv4 } from "uuid";

export class JiraImportWorker extends BaseWorker {
  constructor() {
    super("django_to_node_queue", "django.node");
  }

  protected onMessage(msg: ConsumeMessage | null): void {
    try {
      // Process Jira message
      console.log(msg);

      // Create the send data
      const data = { hello: "world" };

      // Celery task details
      const taskName = "plane.bgtasks.user_welcome_task.send_welcome_slack"; // Full path to your Celery task
      const taskId = uuidv4(); // Unique task ID
      const args = [data]; // Arguments for the task
      const kwargs = {}; // Keyword arguments for the task

      // Constructing the message headers and properties
      const messageHeaders = {
        lang: "py",
        task: taskName,
        id: taskId,
        // Additional headers can be included as needed
      };

      const messageProperties = {
        correlation_id: taskId,
        content_type: "application/json",
        content_encoding: "utf-8",
        // Optional: reply_to
      };

      // Constructing the message body
      const messageBody = {
        args: args || [],
        kwargs: kwargs || {},
        // embed: {} // if you have embedded messages
      };

      const serializedBody = JSON.stringify(messageBody);

      // Construct the full message
      const fullMessage = {
        properties: messageProperties,
        headers: messageHeaders,
        body: Buffer.from(serializedBody).toString("base64"),
      };

      this.publish(
        "node_to_celery_queue",
        Buffer.from(JSON.stringify(fullMessage))
      );
    } catch (error) {
      console.log(error);
    }
  }
}
