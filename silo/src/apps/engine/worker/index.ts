import { TaskManager } from "./manager";

const taskManager = new TaskManager({
  workerTypes: {
    jira: "jira",
    linear: "linear",
    asana: "asana",
    "slack-interaction": "slack-interaction",
    "github-webhook": "github-webhook",
    "gitlab-webhook": "gitlab-webhook",
    "plane-github-webhook": "plane-github-webhook",
    "plane-slack-webhook": "plane-slack-webhook",
  },
  retryAttempts: 3,
  retryDelay: 1000,
});

export default taskManager;
