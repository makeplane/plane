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

import { S3Client, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { logger } from "@plane/logger";
import { env } from "@/env";

export let s3Client: S3Client | undefined;

export const initializeS3Client = async (): Promise<S3Client | undefined> => {
  if (!env.AWS_REGION) {
    logger.error("AWS_REGION must be set");
    return;
  }

  if (!s3Client) {
    const isMinio = !!env.AWS_S3_ENDPOINT_URL;

    const clientConfig: any = {
      region: env.AWS_REGION,
    };

    // Only set endpoint if explicitly provided (MinIO or custom S3)
    if (isMinio) {
      clientConfig.endpoint = env.AWS_S3_ENDPOINT_URL;
      clientConfig.forcePathStyle = true;
    }

    // Only set static credentials if BOTH exist
    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      };
    }

    // If no credentials provided → AWS SDK v3 uses default provider chain (IRSA works)
    s3Client = new S3Client(clientConfig);
  }

  const bucketName = env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    logger.error("AWS_S3_BUCKET_NAME must be set");
    return s3Client;
  }

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    logger.info(`Bucket ${bucketName} exists`);
  } catch (error: any) {
    if (error?.$metadata?.httpStatusCode === 404) {
      try {
        logger.info(`Bucket ${bucketName} not found, creating...`);
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        logger.info(`Bucket ${bucketName} created successfully`);
      } catch (createError) {
        logger.error(`Failed to create bucket ${bucketName}:`, createError);
      }
    } else {
      logger.error(`Error checking bucket ${bucketName}:`, error);
    }
  }

  return s3Client;
};
