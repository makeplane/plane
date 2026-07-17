import { asArray, asRecord, firstNonEmptyRecord, parseGatewayRows, toText } from "./utils";
import { joinApiPath } from "./page-url";

const readApiErrorMessage = async (response: Response, fallbackMessage: string) => {
  const responseText = await response.text();

  try {
    const data = JSON.parse(responseText) as {
      detail?: string;
      error?: string;
      errorMessage?: string;
      error_message?: string;
      message?: string;
    };

    return data.error || data.detail || data.message || data.errorMessage || data.error_message || fallbackMessage;
  } catch {
    return responseText || fallbackMessage;
  }
};

export const fetchKanavioTagRowsPayload = async (cpServerBaseUrl: string, sgEventId: string) => {
  const normalizedCpServerBaseUrl = cpServerBaseUrl.trim();
  const eventId = Number(sgEventId.trim());

  if (!normalizedCpServerBaseUrl) {
    throw new Error("NEXT_PUBLIC_CP_SERVER_URL is required to fetch tags.");
  }

  if (!Number.isFinite(eventId)) {
    throw new Error("A numeric SG event id is required to fetch tags.");
  }

  const response = await fetch(joinApiPath(normalizedCpServerBaseUrl, "/tagging-session/fetch-tags"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event_id: eventId }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, "Unable to fetch event tags."));
  }

  return response.json() as Promise<unknown>;
};

const isFetchedTagRecord = (record: Record<string, unknown>) =>
  Boolean(
    toText(
      record.tag ??
        record.action ??
        record.event_code ??
        record.play ??
        record.timestamp ??
        record.video_time ??
        record.original_stream_name ??
        record.stream_name ??
        record.thumbnail
    )
  );

const extractFetchedTagRows = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry): unknown[] => {
    if (Array.isArray(entry)) return extractFetchedTagRows(entry);

    const record = asRecord(entry);
    if (Object.keys(record).length === 0) return [];
    if (isFetchedTagRecord(record)) return [record];

    const dataRows = asArray(record.data);
    if (dataRows.length > 0) return extractFetchedTagRows(dataRows);

    return [record];
  });
};

export const normalizeFetchedTagPayload = (payload: unknown): Record<string, unknown> | null => {
  if (Array.isArray(payload)) {
    const rows = extractFetchedTagRows(payload);
    return rows.length > 0 ? { tags: rows } : null;
  }

  const record = asRecord(payload);
  if (Object.keys(record).length === 0) return null;

  const resultRows = [
    ...extractFetchedTagRows(asRecord(record["Gateway Response"]).result),
    ...extractFetchedTagRows(record.result),
  ];
  if (resultRows.length > 0) return { ...record, tags: resultRows };

  const gatewayRows = parseGatewayRows(payload);
  if (gatewayRows.length > 0) return { tags: gatewayRows };

  const tags = record.tags ?? record.tagRows ?? record.tag_rows ?? record.records ?? record.data ?? record.result;
  if (Array.isArray(tags)) {
    const rows = extractFetchedTagRows(tags);
    return rows.length > 0 ? { ...record, tags: rows } : tags.length > 0 ? { ...record, tags } : record;
  }

  const nestedRecord = firstNonEmptyRecord(record.data, record.result, record.response);
  if (!nestedRecord) return record;

  const nestedResultRows = extractFetchedTagRows(nestedRecord.result);
  if (nestedResultRows.length > 0) return { ...record, tags: nestedResultRows };

  const nestedRows = parseGatewayRows(nestedRecord);
  if (nestedRows.length > 0) return { ...record, tags: nestedRows };

  const nestedTags =
    nestedRecord.tags ??
    nestedRecord.tagRows ??
    nestedRecord.tag_rows ??
    nestedRecord.records ??
    nestedRecord.data ??
    nestedRecord.result;

  if (Array.isArray(nestedTags)) {
    const rows = extractFetchedTagRows(nestedTags);
    return rows.length > 0 ? { ...record, tags: rows } : { ...record, tags: nestedTags };
  }

  return record;
};

export const isNumericEventId = (value: string) => Number.isFinite(Number(value.trim()));
