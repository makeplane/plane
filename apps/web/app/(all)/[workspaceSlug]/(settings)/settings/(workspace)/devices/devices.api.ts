import type { TDevice, TDeviceFormOptions, TDeviceFormValues, TUserOption } from "./devices.types";
import { buildStreamingUrl, parseGatewayRows, toNumberOrNull, toStringOrEmpty } from "./devices.utils";

const DEVICES_ENDPOINT = "/devices";
const USERS_ENDPOINT = "/user-profiles";
const DEVICE_TYPES_ENDPOINT = "/meta-type?key='DEVICETYPE'";
const APPLICATIONS_ENDPOINT = "/omal/apps?vhost=spip";
const AUTO_DEVICE_CODE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const AUTO_DEVICE_CODE_DIGITS = "123456789";
const AUTO_DEVICE_CODE_LETTER_COUNT = 3;
const AUTO_DEVICE_CODE_DIGIT_COUNT = 4;
const AUTO_DEVICE_CODE_MAX_ATTEMPTS = 20_000;

const templateCache = new Map<string, Record<string, number>>();
const FAILURE_TEXT_MARKERS = ["error", "fail", "failed", "failure", "invalid"];
const hasFailureMarker = (text: string) => FAILURE_TEXT_MARKERS.some((marker) => text.toLowerCase().includes(marker));

const toNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const hasFailureStatus = (value: unknown): boolean => {
  if (typeof value === "boolean") return value === false;
  if (typeof value === "number") return value >= 400 || value < 0;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return FAILURE_TEXT_MARKERS.some((marker) => normalized.includes(marker));
  }

  return false;
};

const extractResponseErrorMessage = (value: unknown, depth = 0): string | null => {
  if (depth > 4 || value === null || value === undefined) return null;

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (entry && typeof entry === "object") {
        const row = entry as { field?: unknown; value?: unknown };
        if (typeof row.field === "string" && ["error", "message", "detail", "reason"].includes(row.field)) {
          const rowMessage = toNonEmptyString(row.value);
          if (!rowMessage) continue;
          if (row.field === "error" || hasFailureMarker(rowMessage)) return rowMessage;
        }
      }
    }

    for (const entry of value) {
      const nested = extractResponseErrorMessage(entry, depth + 1);
      if (nested) return nested;
    }

    return null;
  }

  if (typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const failureFlag =
    hasFailureStatus(record.status) ||
    hasFailureStatus(record.success) ||
    hasFailureStatus(record.ok) ||
    hasFailureStatus(record.code) ||
    hasFailureStatus(record.statusCode);

  const hardErrorFields = ["error", "errorMessage", "error_message", "detail", "reason"];
  for (const key of hardErrorFields) {
    const direct = toNonEmptyString(record[key]);
    if (direct) return direct;
  }

  if (failureFlag) {
    const failureMessageFields = ["message", "msg", "statusText", "status_message"];
    for (const key of failureMessageFields) {
      const failureMessage = toNonEmptyString(record[key]);
      if (failureMessage) return failureMessage;
    }
  }

  const nestedCandidates = [
    record["Gateway Response"],
    record.gatewayResponse,
    record.response,
    record.result,
    record.data,
    record.error,
  ];

  for (const candidate of nestedCandidates) {
    const nested = extractResponseErrorMessage(candidate, depth + 1);
    if (nested) return nested;
  }

  return null;
};

const getResponsePayload = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    try {
      const text = await response.text();
      return toNonEmptyString(text);
    } catch {
      return null;
    }
  }
};

const getJson = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}).`);
  }

  return response.json();
};

const normalizeDeviceCode = (deviceCode: string) => deviceCode.trim().toUpperCase();

const pickRandomChar = (characters: string) => characters.charAt(Math.floor(Math.random() * characters.length));

const escapeSqlStringValue = (value: unknown) => (typeof value === "string" ? value.replace(/'/g, "''") : value);

const createRandomDeviceCode = () => {
  const letters = Array.from({ length: AUTO_DEVICE_CODE_LETTER_COUNT }, () => pickRandomChar(AUTO_DEVICE_CODE_LETTERS))
    .join("")
    .toUpperCase();
  const digits = Array.from({ length: AUTO_DEVICE_CODE_DIGIT_COUNT }, () => pickRandomChar(AUTO_DEVICE_CODE_DIGITS))
    .join("")
    .toUpperCase();

  return `${letters}-${digits}`;
};

const generateDeviceCode = (existingCodes: Set<string>) => {
  for (let attempt = 0; attempt < AUTO_DEVICE_CODE_MAX_ATTEMPTS; attempt += 1) {
    const candidate = createRandomDeviceCode();

    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }

  throw new Error("Unable to auto-generate device ID. Please try again.");
};

const fetchExistingDeviceCodes = async (cpServerBaseUrl: string): Promise<Set<string>> => {
  const payload = await getJson(`${cpServerBaseUrl}${DEVICES_ENDPOINT}`);
  const rows = parseGatewayRows(payload);

  const deviceCodes = rows
    .map((row) => normalizeDeviceCode(toStringOrEmpty(row.deviceId ?? row.device_id)))
    .filter((deviceCode) => deviceCode.length > 0);

  return new Set(deviceCodes);
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
  const normalizedDeviceCode = values.deviceCode.trim();

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
      value: normalizedDeviceCode ? normalizedDeviceCode : undefined,
    },
    { options: [{ field: "pin", templateField: "pin" }], value: values.pin },
    {
      options: [
        { field: "user_id", templateField: "user_id" },
        { field: "userId", templateField: "userId" },
      ],
      value: values.userId ?? undefined,
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
        // CP server interpolates these values into SQL strings, so apostrophes must be escaped.
        value: escapeSqlStringValue(value),
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
  const actionLabel = method === "POST" ? "create" : "update";

  const response = await fetch(`${cpServerBaseUrl}${DEVICES_ENDPOINT}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responsePayload = await getResponsePayload(response);
  const responseErrorMessage = extractResponseErrorMessage(responsePayload);

  if (!response.ok) {
    throw new Error(responseErrorMessage ?? `Failed to ${actionLabel} device (${response.status}).`);
  }

  if (responseErrorMessage) {
    throw new Error(responseErrorMessage);
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
  const normalizedDeviceCode = normalizeDeviceCode(values.deviceCode);
  const deviceCode = normalizedDeviceCode || generateDeviceCode(await fetchExistingDeviceCodes(cpServerBaseUrl));

  await mutateDevice(cpServerBaseUrl, "POST", {
    ...values,
    deviceCode,
  });
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
