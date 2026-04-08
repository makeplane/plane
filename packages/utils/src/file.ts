/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { TProjectMemberImportSummary } from "@plane/types";

/**
 * @description combine the file path with the base URL
 * @param {string} path
 * @returns {string} final URL with the base URL
 */
export const getFileURL = (path: string): string | undefined => {
  if (!path) return undefined;
  const isValidURL = path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:");
  if (isValidURL) return path;
  return `${API_BASE_URL}${path}`;
};

/**
 * @description this function returns the assetId from the asset source
 * @param {string} src
 * @returns {string} assetId
 */
export const getAssetIdFromUrl = (src: string): string => {
  // remove the last char if it is a slash
  if (src.charAt(src.length - 1) === "/") src = src.slice(0, -1);
  const sourcePaths = src.split("/");
  const assetUrl = sourcePaths[sourcePaths.length - 1];
  return assetUrl;
};

/**
 * @description encode image via URL to base64
 * @param {string} url
 * @returns
 */
export const getBase64Image = async (url: string): Promise<string> => {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL provided");
  }

  // Try to create a URL object to validate the URL
  try {
    new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  const response = await fetch(url);
  // check if the response is OK
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error("Failed to convert image to base64."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read the image file."));
    };

    reader.readAsDataURL(blob);
  });
};

/**
 * @description downloads a CSV file
 * @param {Array<Array<string>> | { [key: string]: string }} data - The data to be exported to CSV
 * @param {string} name - The name of the file to be downloaded
 */
export const csvDownload = (data: Array<Array<string>> | { [key: string]: string }, name: string) => {
  const rows = Array.isArray(data) ? [...data] : [Object.keys(data), Object.values(data)];

  const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement("a");
  link.href = encodedUri;
  link.download = `${name}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * @description downloads a text file
 * @param {TProjectMemberImportSummary["skipped_details"]} skippedDetails - The skipped details to be downloaded
 */
const formatErrorValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(formatErrorValue).join(", ");
  if (typeof value === "object" && value !== null) {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${formatErrorValue(v)}`)
      .join("; ");
  }
  return String(value);
};

export const downloadSkippedDetails = (skippedDetails: TProjectMemberImportSummary["skipped_details"]) => {
  const lines: string[] = ["Skipped Import Rows", "=".repeat(40), ""];

  skippedDetails.forEach(({ row, errors }) => {
    lines.push(`Row ${row}:`);
    Object.entries(errors).forEach(([field, message]) => {
      lines.push(`  ${field}: ${formatErrorValue(message)}`);
    });
    lines.push("");
  });

  if (lines.length <= 3) return;

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "import-skipped.txt";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * TourContent - Displays tour step content with carousel animations
 *
 * Shows the tour step image, title, description, and navigation controls.
 * Supports smooth carousel-style transitions between steps.
 *
 * @internal This component is used internally by the Tour component
 */
export const fetchLottieData = async (url: string, signal: AbortSignal): Promise<Record<string, unknown>> => {
  const res = await fetch(url, { signal });
  return res.json() as Promise<Record<string, unknown>>;
};
