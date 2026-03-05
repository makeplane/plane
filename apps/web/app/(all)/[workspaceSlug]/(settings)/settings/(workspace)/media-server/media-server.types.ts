export type TVirtualHostApiRecord = {
  name?: unknown;
  host?: {
    names?: unknown;
  } | null;
  admissionWebhooks?: {
    controlServerUrl?: unknown;
  } | null;
};

export type TVirtualHostState = {
  name: string;
  hostName: string;
  controlServerUrl: string;
};

export type TMediaServerData = {
  applications: string[];
  virtualHost: TVirtualHostState;
};

export const EMPTY_VIRTUAL_HOST: TVirtualHostState = {
  name: "",
  hostName: "",
  controlServerUrl: "",
};
