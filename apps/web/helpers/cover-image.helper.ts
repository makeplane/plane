import type { EFileAssetType } from "@plane/types";
import { getFileURL } from "@plane/utils";
import { FileService } from "@/services/file.service";

const fileService = new FileService();

/**
 * Map of all available static cover images
 * These are pre-loaded images available in the public/images folder
 */
export const STATIC_COVER_IMAGES = {
  IMAGE_1: "/images/image_1.jpg",
  IMAGE_2: "/images/image_2.jpg",
  IMAGE_3: "/images/image_3.jpg",
  IMAGE_4: "/images/image_4.jpg",
  IMAGE_5: "/images/image_5.jpg",
  IMAGE_6: "/images/image_6.jpg",
  IMAGE_7: "/images/image_7.jpg",
  IMAGE_8: "/images/image_8.jpg",
  IMAGE_9: "/images/image_9.jpg",
  IMAGE_10: "/images/image_10.jpg",
  IMAGE_11: "/images/image_11.jpg",
  IMAGE_12: "/images/image_12.jpg",
  IMAGE_13: "/images/image_13.jpg",
  IMAGE_14: "/images/image_14.jpg",
  IMAGE_15: "/images/image_15.jpg",
  IMAGE_16: "/images/image_16.jpg",
  IMAGE_17: "/images/image_17.jpg",
  IMAGE_18: "/images/image_18.jpg",
  IMAGE_19: "/images/image_19.jpg",
  IMAGE_20: "/images/image_20.jpg",
  IMAGE_21: "/images/image_21.jpg",
  IMAGE_22: "/images/image_22.jpg",
  IMAGE_23: "/images/image_23.jpg",
  IMAGE_24: "/images/image_24.jpg",
  IMAGE_25: "/images/image_25.jpg",
  IMAGE_26: "/images/image_26.jpg",
  IMAGE_27: "/images/image_27.jpg",
  IMAGE_28: "/images/image_28.jpg",
  IMAGE_29: "/images/image_29.jpg",
} as const;

export const DEFAULT_COVER_IMAGE_URL = STATIC_COVER_IMAGES.IMAGE_1;

/**
 * Set of static image URLs for fast O(1) lookup
 */
const STATIC_COVER_IMAGES_SET = new Set<string>(Object.values(STATIC_COVER_IMAGES));

export type TCoverImageType = "local_static" | "uploaded_asset";

export interface ICoverImageResult {
  needsUpload: boolean;
  imageType: TCoverImageType;
  shouldUpdate: boolean;
}

export interface ICoverImagePayload {
  cover_image?: string | null;
  cover_image_url?: string | null;
  cover_image_asset?: string | null;
}

/**
 * Checks if a given URL is a valid static cover image
 */
export const isStaticCoverImage = (imageUrl: string | null | undefined): boolean => {
  if (!imageUrl) return false;
  return STATIC_COVER_IMAGES_SET.has(imageUrl);
};

/**
 * Determines the type of cover image URL
 * Uses explicit validation against known static images for better accuracy
 */
export const getCoverImageType = (imageUrl: string): TCoverImageType => {
  // Check against the explicit set of static images
  if (isStaticCoverImage(imageUrl)) return "local_static";

  if (imageUrl.startsWith("http")) return "uploaded_asset";

  return "uploaded_asset";
};

/**
 * Gets the correct display URL for a cover image
 * - Local static images: returned as-is (served from public folder)
 * - Uploaded assets: processed through getFileURL (adds backend URL)
 * - None/null: returns fallback or null
 */
export function getCoverImageDisplayURL(imageUrl: string | null | undefined, fallbackUrl: string): string;
export function getCoverImageDisplayURL(imageUrl: string | null | undefined, fallbackUrl: null): string | null;
export function getCoverImageDisplayURL(
  imageUrl: string | null | undefined,
  fallbackUrl: string | null
): string | null {
  if (!imageUrl) {
    return fallbackUrl;
  }

  const imageType = getCoverImageType(imageUrl);

  switch (imageType) {
    case "local_static":
      return imageUrl;

    case "uploaded_asset":
      return getFileURL(imageUrl) || imageUrl;

    default:
      return imageUrl;
  }
}

/**
 * Analyzes cover image change and determines what action to take
 */
export const analyzeCoverImageChange = (
  currentImage: string | null | undefined,
  newImage: string | null | undefined
): ICoverImageResult => {
  const hasChanged = currentImage !== newImage;

  if (!hasChanged) {
    return {
      needsUpload: false,
      imageType: "uploaded_asset",
      shouldUpdate: false,
    };
  }

  const imageType = getCoverImageType(newImage ?? "");

  return {
    needsUpload: imageType === "local_static",
    imageType,
    shouldUpdate: hasChanged,
  };
};

/**
 * Uploads a local static image to S3
 */
export const uploadCoverImage = async (
  imageUrl: string,
  uploadConfig: {
    workspaceSlug?: string;
    entityIdentifier: string;
    entityType: EFileAssetType;
    isUserAsset?: boolean;
  }
): Promise<string> => {
  const { workspaceSlug, entityIdentifier, entityType, isUserAsset = false } = uploadConfig;

  // Fetch the local image
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const blob = await response.blob();

  // Validate it's actually an image
  if (!blob.type.startsWith("image/")) {
    throw new Error("Invalid file type. Please select an image.");
  }

  const fileName = imageUrl.split("/").pop() || "cover.jpg";
  const file = new File([blob], fileName, { type: blob.type });

  // Upload based on context
  if (isUserAsset) {
    const uploadResult = await fileService.uploadUserAsset(
      {
        entity_identifier: entityIdentifier,
        entity_type: entityType,
      },
      file
    );
    return uploadResult.asset_url;
  } else {
    if (!workspaceSlug) {
      throw new Error("Workspace slug is required for workspace asset upload");
    }

    const uploadResult = await fileService.uploadWorkspaceAsset(
      workspaceSlug,
      {
        entity_identifier: entityIdentifier,
        entity_type: entityType,
      },
      file
    );
    return uploadResult.asset_url;
  }
};

/**
 * Main utility to handle cover image changes with upload
 * Returns the payload fields that should be updated
 */
export const handleCoverImageChange = async (
  currentImage: string | null | undefined,
  newImage: string | null | undefined,
  uploadConfig: {
    workspaceSlug?: string;
    entityIdentifier: string;
    entityType: EFileAssetType;
    isUserAsset?: boolean;
  }
): Promise<ICoverImagePayload | null> => {
  const analysis = analyzeCoverImageChange(currentImage, newImage);

  // No change detected
  if (!analysis.shouldUpdate) {
    return null;
  }

  // Image removed
  if (!newImage) {
    return {
      cover_image: null,
      cover_image_url: null,
      cover_image_asset: null,
    };
  }

  // Local static image - needs upload
  if (analysis.needsUpload) {
    const uploadedUrl = await uploadCoverImage(newImage, uploadConfig);

    // For BOTH user assets AND project assets:
    // The backend auto-links when entity_identifier is set correctly
    // So we don't need to return anything - the link happens server-side!

    if (uploadConfig.isUserAsset) {
      // User assets: return URL for display (optional, mostly for immediate feedback)
      return {
        cover_image_url: uploadedUrl,
      };
    } else {
      // Project assets: Auto-linked server-side during upload!
      // No need to return anything or call bulk API
      return null;
    }
  }
  // Already uploaded asset - no action needed
  if (analysis.imageType === "uploaded_asset") {
    return null;
  }

  return null;
};
