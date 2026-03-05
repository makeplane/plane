import type { TMediaServerData } from "./media-server.types";
import { normalizeApplications, normalizeVirtualHost, parseVirtualHostRecords } from "./media-server.utils";

const APPLICATIONS_ENDPOINT = "/omal/apps?vhost=spip";
const VHOST_ENDPOINT = "/omal/vhost-info";
const CREATE_APP_ENDPOINTS = ["/omal/create-app", APPLICATIONS_ENDPOINT, "/omal/apps", "/omal/app"] as const;
const DELETE_APP_ENDPOINTS = ["/omal/app", APPLICATIONS_ENDPOINT, "/omal/apps"] as const;

const throwIfNotOk = (response: Response, message: string) => {
  if (!response.ok) {
    throw new Error(`${message} (${response.status}).`);
  }
};

const parseMutationErrorMessage = async (response: Response): Promise<string | null> => {
  try {
    const payload = (await response.json()) as {
      error?: unknown;
      message?: unknown;
      detail?: unknown;
    };
    const candidates = [payload.error, payload.message, payload.detail];
    for (const value of candidates) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
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

    if (response.ok) return;

    const mutationError = await parseMutationErrorMessage(response);
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
  const [applicationsResponse, virtualHostResponse] = await Promise.all([
    fetch(`${cpServerBaseUrl}${APPLICATIONS_ENDPOINT}`, { cache: "no-store" }),
    fetch(`${cpServerBaseUrl}${VHOST_ENDPOINT}`, { cache: "no-store" }),
  ]);

  throwIfNotOk(applicationsResponse, "Failed to fetch applications");
  throwIfNotOk(virtualHostResponse, "Failed to fetch virtual host info");

  const applicationsPayload = (await applicationsResponse.json()) as {
    "Gateway Response"?: {
      applications?: unknown;
    };
  };
  const virtualHostPayload = (await virtualHostResponse.json()) as unknown;

  const applications = normalizeApplications(applicationsPayload?.["Gateway Response"]?.applications);
  const virtualHostRecords = parseVirtualHostRecords(virtualHostPayload);
  const virtualHost = normalizeVirtualHost(virtualHostRecords[0]);

  return {
    applications,
    virtualHost,
  };
};

export const createApplication = async (cpServerBaseUrl: string, applicationName: string) => {
  await mutateApplication(cpServerBaseUrl, "POST", applicationName, "Failed to add application", CREATE_APP_ENDPOINTS);
};

export const removeApplication = async (cpServerBaseUrl: string, applicationName: string) => {
  await mutateApplication(cpServerBaseUrl, "DELETE", applicationName, "Failed to remove application", DELETE_APP_ENDPOINTS);
};
