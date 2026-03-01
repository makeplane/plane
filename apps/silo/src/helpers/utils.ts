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

import axios, { isAxiosError } from "axios";
import { parse } from "node-html-parser";
import { validate as uuidValidate } from "uuid";

import { logger } from "@plane/logger";
import { Client as PlaneClient } from "@plane/sdk";
import { env } from "@/env";
import { getValidCredentials } from "./credential";
export const removeSpanAroundImg = (htmlContent: string): string => {
  // Parse the HTML content
  const root = parse(htmlContent);

  // Find all <img> tags
  const imgTags = root.querySelectorAll("img");

  imgTags.forEach((img) => {
    const parent = img.parentNode;

    // Check if the parent is a <span> tag
    if (parent && parent.tagName === "SPAN") {
      // Replace the <span> tag with its children (including the <img> tag)
      parent.replaceWith(...parent.childNodes);
    }
  });

  // Serialize the modified HTML back to a string
  return root.toString();
};

export const splitStringTillPart = (input: string, part: string): string => {
  // Split the string by '/'
  const parts = input.split("/");

  // Find the index of the part
  const index = parts.indexOf(part);

  // If the part is not found, return an empty string or handle the error as needed
  if (index === -1) {
    return "";
  }

  // Join the parts from the desired index to the end
  const result = parts.slice(index).join("/");

  // Add the leading '/' if needed
  return "/" + result;
};

export const downloadFile = async (url: string, authToken?: string): Promise<Blob | undefined> => {
  try {
    if (!authToken) {
      logger.error("Auth token not found", { url });
      return;
    }

    // Make a head call to get the content-length
    const headResponse = await axios({
      url,
      method: "HEAD",
      headers: {
        Authorization: authToken,
      },
    });

    if (Number(headResponse.headers["content-length"]) > Number(env.SILO_FILE_SIZE_LIMIT)) {
      logger.error("File size exceeds the limit", { fileSize: headResponse.headers["content-length"], url });
      return;
    }

    const response = await axios({
      url,
      method: "GET",
      responseType: "arraybuffer",
      headers: {
        Authorization: authToken,
      },
    });

    if (!response.data) {
      logger.error("Asset download failed with status code:", response.status, { url });
      return;
    }

    const buffer = Buffer.from(response.data);
    const blob = new Blob([buffer], { type: response.headers["content-type"] });
    return blob;
  } catch (e) {
    if (isAxiosError(e)) {
      const buffer = Buffer.from(e.response?.data);
      logger.error("Assest download failed:", buffer.toString("utf-8"));
    } else {
      logger.error("Assest download failed:", e);
    }
  }
};

interface UploadFileParams {
  url: string;
  data: FormData;
}

export const uploadFile = async ({ url, data }: UploadFileParams): Promise<boolean> => {
  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.status === 204 || response.status === 200;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error("Upload failed:", error.response?.data || error.message);
    } else {
      logger.error("Upload failed:", error);
    }
    throw error;
  }
};

export const encapsulateInQuoteBlock = (text: string) =>
  text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");

export const createPlaneClient = async (workspaceId: string, userId: string, source: string): Promise<PlaneClient> => {
  try {
    const credential = await getValidCredentials(workspaceId, userId, source);

    return new PlaneClient({
      baseURL: env.API_BASE_URL,
      apiToken: credential.target_access_token || "",
    });
  } catch (error) {
    throw error;
  }
};

export const titleCase = (word: string) =>
  word
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const isUUID = (id: string | null) => id && uuidValidate(id);

export const invertStringMap = (map: Map<string, string>) => {
  const invertedMap = new Map<string, string>();
  map.forEach((value, key) => {
    invertedMap.set(value, key);
  });
  return invertedMap;
};
