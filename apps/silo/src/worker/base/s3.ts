import { S3Client, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { logger } from "@plane/logger";
import { env } from "@/env";

// Where should I keep the initialisation of the S3Client?
// Configure S3Client to use MinIO running on port 9000

export let s3Client: S3Client | undefined = undefined;

export const initializeS3Client = async () => {
  const isSupported = env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_REGION;

  if (!isSupported) {
    logger.error("AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION must be set");
    return;
  }

  if (!s3Client) {
    // Construct endpoint URL if not provided
    const endpointUrl = env.AWS_S3_ENDPOINT_URL || `https://s3.${env.AWS_REGION}.amazonaws.com`;

    s3Client = new S3Client({
      region: env.AWS_REGION,
      endpoint: endpointUrl,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }

  // Ensure bucket exists during initialization
  const bucketName = env.AWS_S3_BUCKET_NAME || "silo";

  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    logger.info(`Bucket ${bucketName} exists`);
  } catch (error: any) {
    // If error code is 404, bucket doesn't exist
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      try {
        logger.info(`Bucket ${bucketName} not found, creating...`);
        await s3Client.send(
          new CreateBucketCommand({
            Bucket: bucketName,
          })
        );
        logger.info(`Bucket ${bucketName} created successfully`);
      } catch (createError) {
        logger.error(`Failed to create bucket ${bucketName}:`, createError);
      }
    } else {
      // Other error (access denied, etc.)
      logger.error(`Error checking bucket ${bucketName}:`, error);
    }
  }

  return s3Client;
};
