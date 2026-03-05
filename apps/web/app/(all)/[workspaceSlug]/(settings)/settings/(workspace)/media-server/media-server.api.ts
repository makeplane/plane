import type { TMediaServerData } from "./media-server.types";
import { normalizeApplications, normalizeVirtualHost, parseVirtualHostRecords } from "./media-server.utils";

const APPLICATIONS_ENDPOINT = "/omal/apps?vhost=spip";
const VHOST_ENDPOINT = "/omal/vhost-info";
const APP_ENDPOINT = "/omal/app";

const throwIfNotOk = (response: Response, message: string) => {
  if (!response.ok) {
    throw new Error(`${message} (${response.status}).`);
  }
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
  const response = await fetch(`${cpServerBaseUrl}${APP_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ "app-name": applicationName }),
  });

  throwIfNotOk(response, "Failed to add application");
};

export const removeApplication = async (cpServerBaseUrl: string, applicationName: string) => {
  const response = await fetch(`${cpServerBaseUrl}${APP_ENDPOINT}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ "app-name": applicationName }),
  });

  throwIfNotOk(response, "Failed to remove application");
};
