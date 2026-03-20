import type { TMediaServerData } from "./media-server.types";
import { normalizeApplications, normalizeVirtualHost, parseVirtualHostRecords } from "./media-server.utils";

const APPLICATIONS_ENDPOINT = "/omal/apps?vhost=spip";
const VHOST_ENDPOINT = "/omal/vhost-info";
const CREATE_APP_ENDPOINTS = ["/omal/create-app", APPLICATIONS_ENDPOINT, "/omal/apps", "/omal/app"] as const;
const DELETE_APP_ENDPOINTS = ["/omal/app", APPLICATIONS_ENDPOINT, "/omal/apps"] as const;

const toNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const throwIfNotOk = (response: Response, message: string) => {
  if (!response.ok) {
    throw new Error(`${message} (${response.status}).`);
  }
};

const extractMutationErrorMessage = (value: unknown, depth = 0): string | null => {
  if (depth > 4 || value === null || value === undefined) return null;

  if (typeof value === "string") return toNonEmptyString(value);

  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = extractMutationErrorMessage(entry, depth + 1);
      if (nested) return nested;
    }

    return null;
  }

  if (typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const directFields = ["error", "message", "detail", "reason", "statusText"];

  for (const key of directFields) {
    const direct = toNonEmptyString(record[key]);
    if (direct) return direct;
  }

  const nestedCandidates = [record["Gateway Response"], record.gatewayResponse, record.response, record.data, record.result];

  for (const candidate of nestedCandidates) {
    const nested = extractMutationErrorMessage(candidate, depth + 1);
    if (nested) return nested;
  }

  return null;
};

const getMutationPayload = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    // Fall through to text parsing.
  }

  try {
    const text = await response.text();
    return text.trim() || null;
  } catch {
    return null;
  }
};

const shouldTryMutationFallback = (status: number, message: string | null) => {
  if (status === 404) return true;
  if (status !== 500 || !message) return false;
  return message.toLowerCase().includes("handler not found");
};

const mutateApplication = async (
  cpServerBaseUrl: string,
  method: "POST" | "DELETE",
  applicationName: string,
  failureMessage: string,
  endpoints: readonly string[]
) => {
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    const response = await fetch(`${cpServerBaseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ "app-name": applicationName }),
    });

    const mutationPayload = await getMutationPayload(response);
    const mutationError = extractMutationErrorMessage(mutationPayload);

    if (response.ok && !mutationError) return;

    const errorMessage = mutationError ?? `${failureMessage} (${response.status}).`;
    const isFallbackAllowed =
      endpoint !== endpoints[endpoints.length - 1] &&
      shouldTryMutationFallback(response.status, mutationError);

    if (isFallbackAllowed) {
      lastError = new Error(errorMessage);
      continue;
    }

    throw new Error(errorMessage);
  }

  throw lastError ?? new Error(failureMessage);
};

export const fetchMediaServerData = async (cpServerBaseUrl: string): Promise<TMediaServerData> => {
  const [applications, virtualHost] = await Promise.all([
    fetchApplications(cpServerBaseUrl),
    fetchVirtualHost(cpServerBaseUrl),
  ]);

  return {
    applications,
    virtualHost,
  };
};

export const fetchApplications = async (cpServerBaseUrl: string): Promise<string[]> => {
  const applicationsResponse = await fetch(`${cpServerBaseUrl}${APPLICATIONS_ENDPOINT}`, { cache: "no-store" });

  throwIfNotOk(applicationsResponse, "Failed to fetch applications");

  const applicationsPayload = (await applicationsResponse.json()) as {
    "Gateway Response"?: {
      applications?: unknown;
    };
  };

  return normalizeApplications(applicationsPayload?.["Gateway Response"]?.applications);
};

export const fetchVirtualHost = async (cpServerBaseUrl: string) => {
  const virtualHostResponse = await fetch(`${cpServerBaseUrl}${VHOST_ENDPOINT}`, { cache: "no-store" });

  throwIfNotOk(virtualHostResponse, "Failed to fetch virtual host info");

  const virtualHostPayload = (await virtualHostResponse.json()) as unknown;

  const virtualHostRecords = parseVirtualHostRecords(virtualHostPayload);

  return normalizeVirtualHost(virtualHostRecords[0]);
};

export const createApplication = async (cpServerBaseUrl: string, applicationName: string) => {
  await mutateApplication(cpServerBaseUrl, "POST", applicationName, "Failed to add application", CREATE_APP_ENDPOINTS);
};

export const removeApplication = async (cpServerBaseUrl: string, applicationName: string) => {
  await mutateApplication(cpServerBaseUrl, "DELETE", applicationName, "Failed to remove application", DELETE_APP_ENDPOINTS);
};
