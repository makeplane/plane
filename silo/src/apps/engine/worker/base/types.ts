export type TAppType = "extension" | "api";

export type TMQEntityOptions =
  | {
      appType: "extension";
      queueName: string;
      routingKey: string;
    }
  | {
      appType: "api";
    };

