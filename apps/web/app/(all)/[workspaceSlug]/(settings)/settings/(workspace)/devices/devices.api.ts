import type { TDevice, TDeviceFormOptions, TDeviceFormValues, TUserOption } from "./devices.types";
import { buildStreamingUrl, parseGatewayRows, toNumberOrNull, toStringOrEmpty } from "./devices.utils";

const DEVICES_ENDPOINT = "/devices";
const USERS_ENDPOINT = "/user-profiles";
const DEVICE_TYPES_ENDPOINT = "/meta-type?key='DEVICETYPE'";
const APPLICATIONS_ENDPOINT = "/omal/apps?vhost=spip";

const templateCache = new Map<string, Record<string, number>>();

const getJson = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}).`);
  }

  return response.json();
};

const getTemplateMap = async (cpServerBaseUrl: string, resource: string): Promise<Record<string, number>> => {
  const cached = templateCache.get(resource);
  if (cached) return cached;

  const payload = (await getJson(`${cpServerBaseUrl}/${resource}/template`)) as {
    "Gateway Response"?: Array<{ field?: unknown; type?: unknown }>;
  };

  const gatewayResponse = payload?.["Gateway Response"];
  const template = Array.isArray(gatewayResponse)
    ? gatewayResponse.reduce<Record<string, number>>((acc, item) => {
        const field = item?.field;
        const type = item?.type;

        if (typeof field === "string" && typeof type === "number") {
          acc[field] = type;
        }

        return acc;
      }, {})
    : {};

  templateCache.set(resource, template);
  return template;
};

const resolveFieldMapping = (
  template: Record<string, number>,
  options: Array<{ field: string; templateField: string }>
): { field: string; type: number } | null => {
  for (const option of options) {
    const type = template[option.templateField];
    if (typeof type === "number") {
      return {
        field: option.field,
        type,
      };
    }
  }

  return null;
};

const buildDeviceMutationPayload = async (cpServerBaseUrl: string, values: TDeviceFormValues) => {
  const template = await getTemplateMap(cpServerBaseUrl, "devices");

  const fields: Array<{
    options: Array<{ field: string; templateField: string }>;
    value: unknown;
  }> = [
    { options: [{ field: "type", templateField: "type" }], value: values.deviceType },
    { options: [{ field: "name", templateField: "name" }], value: values.deviceName },
    {
      options: [
        { field: "device_id", templateField: "device_id" },
        { field: '"deviceId"', templateField: "deviceId" },
        { field: "deviceId", templateField: "deviceId" },
      ],
      value: values.deviceCode,
    },
    { options: [{ field: "pin", templateField: "pin" }], value: values.pin },
    {
      options: [
        { field: "user_id", templateField: "user_id" },
        { field: "userId", templateField: "userId" },
      ],
      value: values.userId,
    },
    {
      options: [
        { field: "app_name", templateField: "app_name" },
        { field: "appName", templateField: "appName" },
      ],
      value: values.appName,
    },
  ];

  const columns = fields
    .filter(({ value }) => value !== undefined)
    .map(({ options, value }) => {
      const mapping = resolveFieldMapping(template, options);
      if (!mapping) return null;

      return {
        field: mapping.field,
        type: mapping.type,
        value,
      };
    })
    .filter((item): item is { field: string; type: number; value: unknown } => item !== null);

  return {
    table: "devices",
    columns,
    criteria: [{ field: "id", value: values.id }],
  };
};

const mutateDevice = async (
  cpServerBaseUrl: string,
  method: "POST" | "PUT",
  values: TDeviceFormValues
): Promise<void> => {
  const payload = await buildDeviceMutationPayload(cpServerBaseUrl, values);

  const response = await fetch(`${cpServerBaseUrl}${DEVICES_ENDPOINT}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to ${method === "POST" ? "create" : "update"} device (${response.status}).`);
  }
};

const mapDeviceFromRow = (row: Record<string, unknown>, cpServerBaseUrl: string): TDevice | null => {
  const id = toNumberOrNull(row.id);
  if (id === null) return null;

  const appName = toStringOrEmpty(row.app_name ?? row.appName);
  const pin = toStringOrEmpty(row.pin);
  const createdAtRaw = row.created_at ?? row.createdAt ?? null;
  const createdAt =
    typeof createdAtRaw === "string"
      ? createdAtRaw
      : typeof createdAtRaw === "number"
        ? new Date(createdAtRaw > 10_000_000_000 ? createdAtRaw : createdAtRaw * 1000).toISOString()
        : null;

  const device: TDevice = {
    id,
    deviceName: toStringOrEmpty(row.name),
    deviceType: toStringOrEmpty(row.type),
    deviceCode: toStringOrEmpty(row.deviceId ?? row.device_id),
    appName,
    pin,
    userId: toNumberOrNull(row.user_id ?? row.userId),
    createdAt,
    streamingUrl: "",
  };

  return {
    ...device,
    streamingUrl: buildStreamingUrl(device, cpServerBaseUrl),
  };
};

const mapDeviceTypes = (rows: Record<string, unknown>[]): string[] => {
  const values = rows[0]?.values;
  if (!Array.isArray(values)) return [];

  return values
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object") {
        const label = (entry as { value?: unknown; name?: unknown }).value ?? (entry as { name?: unknown }).name;
        return typeof label === "string" ? label : "";
      }

      return "";
    })
    .filter((item) => item.length > 0);
};

const mapUsers = (rows: Record<string, unknown>[]): TUserOption[] =>
  rows
    .map((row) => {
      const id = toNumberOrNull(row.id);
      if (id === null) return null;

      const firstName = toStringOrEmpty(row.firstname ?? row.first_name);
      const lastName = toStringOrEmpty(row.lastname ?? row.last_name);
      const fullName = `${firstName} ${lastName}`.trim();

      return {
        id,
        label: fullName || `User ${id}`,
      };
    })
    .filter((item): item is TUserOption => item !== null);

export const fetchDevices = async (cpServerBaseUrl: string): Promise<TDevice[]> => {
  const payload = await getJson(`${cpServerBaseUrl}${DEVICES_ENDPOINT}`);
  const rows = parseGatewayRows(payload);

  return rows
    .map((row) => mapDeviceFromRow(row, cpServerBaseUrl))
    .filter((item): item is TDevice => item !== null)
    .sort((a, b) => a.deviceName.localeCompare(b.deviceName));
};

export const fetchDeviceFormOptions = async (cpServerBaseUrl: string): Promise<TDeviceFormOptions> => {
  const [deviceTypePayload, usersPayload, applicationsPayload] = await Promise.all([
    getJson(`${cpServerBaseUrl}${DEVICE_TYPES_ENDPOINT}`),
    getJson(`${cpServerBaseUrl}${USERS_ENDPOINT}`),
    getJson(`${cpServerBaseUrl}${APPLICATIONS_ENDPOINT}`),
  ]);

  const applications = Array.isArray(
    (applicationsPayload as { "Gateway Response"?: { applications?: unknown } })?.["Gateway Response"]?.applications
  )
    ? (
        (applicationsPayload as { "Gateway Response"?: { applications?: unknown } })["Gateway Response"]
          ?.applications as unknown[]
      )
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

  return {
    applications,
    deviceTypes: mapDeviceTypes(parseGatewayRows(deviceTypePayload)),
    users: mapUsers(parseGatewayRows(usersPayload)),
  };
};

export const createDevice = async (cpServerBaseUrl: string, values: TDeviceFormValues) => {
  await mutateDevice(cpServerBaseUrl, "POST", values);
};

export const updateDevice = async (cpServerBaseUrl: string, values: TDeviceFormValues) => {
  await mutateDevice(cpServerBaseUrl, "PUT", values);
};

export const deleteDevice = async (cpServerBaseUrl: string, id: number): Promise<void> => {
  const response = await fetch(`${cpServerBaseUrl}${DEVICES_ENDPOINT}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      table: "devices",
      columns: [],
      criteria: [{ field: "id", value: id }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete device (${response.status}).`);
  }
};
