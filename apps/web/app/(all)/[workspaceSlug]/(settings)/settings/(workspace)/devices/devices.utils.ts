import type { TDevice } from "./devices.types";

type TCppField = {
  field: string;
  type: number;
  value: unknown;
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const getCpServerBaseUrl = () => process.env.NEXT_PUBLIC_CP_SERVER_URL?.replace(/\/$/, "") ?? "";

export const cppToObject = (cppObj: unknown): Record<string, unknown> => {
  if (!Array.isArray(cppObj)) return {};

  return cppObj.reduce<Record<string, unknown>>((acc, entry) => {
    if (!entry || typeof entry !== "object") return acc;

    const { field, type, value } = entry as TCppField;
    if (typeof field !== "string") return acc;

    if (type === 6 && Array.isArray(value)) {
      acc[field] = value.map((item) => cppToObject(item));
      return acc;
    }

    acc[field] = value;
    return acc;
  }, {});
};

export const parseGatewayRows = (payload: unknown): Record<string, unknown>[] => {
  if (!payload || typeof payload !== "object") return [];

  const gatewayResponse = (payload as { "Gateway Response"?: unknown })["Gateway Response"];
  if (!gatewayResponse || typeof gatewayResponse !== "object") return [];

  const result = (gatewayResponse as { result?: unknown }).result;
  if (!Array.isArray(result)) return [];

  return result.map((row) => cppToObject(row));
};

const getHostFromUrl = (url: string): string | null => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

const getRtmpHost = (cpServerBaseUrl: string): string => {
  const configuredRtmpUrl = process.env.NEXT_PUBLIC_RTMP_URL;

  if (configuredRtmpUrl) {
    const cleaned = configuredRtmpUrl.replace(/^[a-zA-Z]+:\/\//, "");
    const host = cleaned.split(":")[0]?.trim();
    if (host) return host;
  }

  return getHostFromUrl(cpServerBaseUrl) ?? "localhost";
};

const getRtmpProtocol = () => {
  const configuredRtmpUrl = process.env.NEXT_PUBLIC_RTMP_URL;
  if (!configuredRtmpUrl) return "rtmp";

  if (configuredRtmpUrl.startsWith("rtmps://")) return "rtmps";
  return "rtmp";
};

export const getRtmpBaseUrl = (cpServerBaseUrl: string) => {
  const protocol = getRtmpProtocol();
  const host = getRtmpHost(cpServerBaseUrl);
  return `${protocol}://${host}:1935`;
};

export const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const toStringOrEmpty = (value: unknown): string => (typeof value === "string" ? value : "");

export const buildStreamingUrl = (device: Pick<TDevice, "appName" | "id" | "pin">, cpServerBaseUrl: string) => {
  const rtmpBaseUrl = getRtmpBaseUrl(cpServerBaseUrl);
  return `${rtmpBaseUrl}/${device.appName}/${device.id}/${device.pin}/`;
};
