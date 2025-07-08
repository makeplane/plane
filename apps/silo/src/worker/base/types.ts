export type TAppType = "extension" | "api";

export type TMQEntityOptions = {
  appType: "import-tasks" | "integration-tasks" | "extension";
  queueName: string;
  routingKey: string;
  exchange?: string;
};
