import { TaskManager } from "./manager"

const taskManager = new TaskManager({
  workerTypes: {
    jira: "jira",
    linear: "linear"
  },
  retryAttempts: 3,
  retryDelay: 1000
})

export default taskManager
