"use server";

import { NextResponse } from "next/server";
import { getKanavioTaggingServiceHeaders } from "@/lib/kanavio-tagging-service";

const DEFAULT_CP_SERVER_URL = "https://sports.kanavio.com/sports/api";

const normalizeBaseUrl = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  try {
    const url = new URL(trimmedValue);
    const normalizedPath = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/g, "");
    return `${url.origin}${normalizedPath}`;
  } catch {
    return null;
  }
};

const joinApiPath = (baseUrl: string, path: string) => `${baseUrl.replace(/\/+$/g, "")}/${path.replace(/^\/+/g, "")}`;

const getFetchTagsUrl = () =>
  process.env.KANAVIO_FETCH_TAGS_URL?.trim() ||
  process.env.NEXT_PUBLIC_KANAVIO_FETCH_TAGS_URL?.trim() ||
  joinApiPath(
    normalizeBaseUrl(
      process.env.COACH_SERVICE_GATEWAY_URL?.trim() ||
        process.env.SERVICE_GATEWAY_INTERNAL_BASE_URL?.trim() ||
        process.env.NEXT_PUBLIC_CP_SERVER_URL?.trim() ||
        process.env.NEXT_PUBLIC_SERVICE_GATEWAY_URL?.trim() ||
        DEFAULT_CP_SERVER_URL
    ) ?? DEFAULT_CP_SERVER_URL,
    "tagging-session/fetch-tags"
  );

const readErrorFromText = (rawText: string, fallbackMessage: string) => {
  try {
    const data = JSON.parse(rawText) as {
      detail?: string;
      error?: string;
      errorMessage?: string;
      error_message?: string;
      message?: string;
    };

    return data.error || data.detail || data.message || data.errorMessage || data.error_message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

const normalizeEventId = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value.trim());
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
};

export async function POST(request: Request) {
  let requestBody: Record<string, unknown>;

  try {
    requestBody = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventId = normalizeEventId(requestBody.event_id);

  if (eventId == null) {
    return NextResponse.json({ error: "A numeric event_id is required." }, { status: 400 });
  }

  try {
    const response = await fetch(getFetchTagsUrl(), {
      method: "POST",
      headers: getKanavioTaggingServiceHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({ event_id: eventId }),
      cache: "no-store",
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: readErrorFromText(responseText, responseText || "Unable to fetch event tags.") },
        { status: response.status }
      );
    }

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch event tags." },
      { status: 502 }
    );
  }
}
