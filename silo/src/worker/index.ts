import { CeleryProducer } from "./celery";
import { TaskManager } from "./manager";

export const importTaskManger = new TaskManager({
  workerTypes: {
    jira: "jira",
    linear: "linear",
    linear_docs: "linear_docs",
    asana: "asana",
    jira_server: "jira_server",
    flatfile: "flatfile",
  },
  retryAttempts: 3,
  retryDelay: 1000,
});

export const integrationTaskManager = new TaskManager({
  workerTypes: {
    "slack-interaction": "slack-interaction",
    "github-webhook": "github-webhook",
    "gitlab-webhook": "gitlab-webhook",
    "plane-github-webhook": "plane-github-webhook",
    "plane-slack-webhook": "plane-slack-webhook",
  },
  retryAttempts: 3,
  retryDelay: 1000,
});

export const celeryProducer = new CeleryProducer();
