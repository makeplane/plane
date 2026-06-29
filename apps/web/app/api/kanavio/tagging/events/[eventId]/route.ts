"use server";

import { NextResponse } from "next/server";
import { getKanavioTaggingServiceBaseUrl, getKanavioTaggingServiceHeaders } from "@/lib/kanavio-tagging-service";

// export const dynamic = "force-dynamic";

const TAGGING_SERVICE_NOT_CONFIGURED =
  "Kanavio tagging service is not configured. Set KANAVIO_TAGGING_SERVICE_URL.";

const readErrorFromText = (rawText: string, fallbackMessage: string) => {
  try {
    const data = JSON.parse(rawText) as {
      detail?: string;
      error?: string;
      errorMessage?: string;
      error_message?: string;
      message?: string;
    };

    return (
      data.error ||
      data.detail ||
      data.message ||
      data.errorMessage ||
      data.error_message ||
      fallbackMessage
    );
  } catch {
    return fallbackMessage;
  }
};

export async function GET(_request: Request, { params }: { params: { eventId: string } }) {
  const baseUrl = getKanavioTaggingServiceBaseUrl();

  if (!baseUrl) {
    return NextResponse.json({ error: TAGGING_SERVICE_NOT_CONFIGURED }, { status: 503 });
  }

  const response = await fetch(`${baseUrl}/v1/events/${encodeURIComponent(params.eventId)}`, {
    method: "GET",
    headers: getKanavioTaggingServiceHeaders(),
    cache: "no-store",
  });

  const responseText = await response.text();

  if (!response.ok) {
    return NextResponse.json(
      { error: readErrorFromText(responseText, responseText || "Unable to fetch event.") },
      { status: response.status }
    );
  }

  return new NextResponse(responseText, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json",
    },
  });
}
