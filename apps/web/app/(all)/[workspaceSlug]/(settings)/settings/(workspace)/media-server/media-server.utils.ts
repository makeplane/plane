import { EMPTY_VIRTUAL_HOST } from "./media-server.types";
import type { TVirtualHostApiRecord, TVirtualHostState } from "./media-server.types";

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const getCpServerBaseUrl = () => process.env.NEXT_PUBLIC_CP_SERVER_URL?.replace(/\/$/, "") ?? "";

export const normalizeApplications = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export const parseVirtualHostRecords = (payload: unknown): TVirtualHostApiRecord[] => {
  if (!payload || typeof payload !== "object") return [];

  const gatewayResponse = (payload as { "Gateway Response"?: unknown })["Gateway Response"];
  if (!gatewayResponse || typeof gatewayResponse !== "object") return [];

  const result = (gatewayResponse as { result?: unknown }).result;
  if (!Array.isArray(result)) return [];

  if (result.length > 0 && Array.isArray(result[0])) {
    return (result[0] as unknown[]).filter(
      (item): item is TVirtualHostApiRecord => typeof item === "object" && item !== null
    );
  }

  return result.filter((item): item is TVirtualHostApiRecord => typeof item === "object" && item !== null);
};

export const normalizeVirtualHost = (record?: TVirtualHostApiRecord): TVirtualHostState => {
  if (!record) return EMPTY_VIRTUAL_HOST;

  const names = record.host?.names;

  return {
    name: typeof record.name === "string" ? record.name : "",
    hostName: Array.isArray(names) && typeof names[0] === "string" ? names[0] : "",
    controlServerUrl:
      typeof record.admissionWebhooks?.controlServerUrl === "string" ? record.admissionWebhooks.controlServerUrl : "",
  };
};
