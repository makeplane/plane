import type { EFileAssetType } from "@plane/types";
import { getFileURL } from "@plane/utils";

import CoverImage1 from "@/app/assets/cover-images/image_1.jpg?url";
import CoverImage10 from "@/app/assets/cover-images/image_10.jpg?url";
import CoverImage11 from "@/app/assets/cover-images/image_11.jpg?url";
import CoverImage12 from "@/app/assets/cover-images/image_12.jpg?url";
import CoverImage13 from "@/app/assets/cover-images/image_13.jpg?url";
import CoverImage14 from "@/app/assets/cover-images/image_14.jpg?url";
import CoverImage15 from "@/app/assets/cover-images/image_15.jpg?url";
import CoverImage16 from "@/app/assets/cover-images/image_16.jpg?url";
import CoverImage17 from "@/app/assets/cover-images/image_17.jpg?url";
import CoverImage18 from "@/app/assets/cover-images/image_18.jpg?url";
import CoverImage19 from "@/app/assets/cover-images/image_19.jpg?url";
import CoverImage2 from "@/app/assets/cover-images/image_2.jpg?url";
import CoverImage20 from "@/app/assets/cover-images/image_20.jpg?url";
import CoverImage21 from "@/app/assets/cover-images/image_21.jpg?url";
import CoverImage22 from "@/app/assets/cover-images/image_22.jpg?url";
import CoverImage23 from "@/app/assets/cover-images/image_23.jpg?url";
import CoverImage24 from "@/app/assets/cover-images/image_24.jpg?url";
import CoverImage25 from "@/app/assets/cover-images/image_25.jpg?url";
import CoverImage26 from "@/app/assets/cover-images/image_26.jpg?url";
import CoverImage27 from "@/app/assets/cover-images/image_27.jpg?url";
import CoverImage28 from "@/app/assets/cover-images/image_28.jpg?url";
import CoverImage29 from "@/app/assets/cover-images/image_29.jpg?url";
import CoverImage3 from "@/app/assets/cover-images/image_3.jpg?url";
import CoverImage4 from "@/app/assets/cover-images/image_4.jpg?url";
import CoverImage5 from "@/app/assets/cover-images/image_5.jpg?url";
import CoverImage6 from "@/app/assets/cover-images/image_6.jpg?url";
import CoverImage7 from "@/app/assets/cover-images/image_7.jpg?url";
import CoverImage8 from "@/app/assets/cover-images/image_8.jpg?url";
import CoverImage9 from "@/app/assets/cover-images/image_9.jpg?url";

import { FileService } from "@/services/file.service";

const fileService = new FileService();

/**
 * Map of all available static cover images
 * These are pre-loaded images available in the assets/cover-images folder
 */
export const STATIC_COVER_IMAGES = {
  IMAGE_1: CoverImage1,
  IMAGE_2: CoverImage2,
  IMAGE_3: CoverImage3,
  IMAGE_4: CoverImage4,
  IMAGE_5: CoverImage5,
  IMAGE_6: CoverImage6,
  IMAGE_7: CoverImage7,
  IMAGE_8: CoverImage8,
  IMAGE_9: CoverImage9,
  IMAGE_10: CoverImage10,
  IMAGE_11: CoverImage11,
  IMAGE_12: CoverImage12,
  IMAGE_13: CoverImage13,
  IMAGE_14: CoverImage14,
  IMAGE_15: CoverImage15,
  IMAGE_16: CoverImage16,
  IMAGE_17: CoverImage17,
  IMAGE_18: CoverImage18,
  IMAGE_19: CoverImage19,
  IMAGE_20: CoverImage20,
  IMAGE_21: CoverImage21,
  IMAGE_22: CoverImage22,
  IMAGE_23: CoverImage23,
  IMAGE_24: CoverImage24,
  IMAGE_25: CoverImage25,
  IMAGE_26: CoverImage26,
  IMAGE_27: CoverImage27,
  IMAGE_28: CoverImage28,
  IMAGE_29: CoverImage29,
} as const;

export const DEFAULT_COVER_IMAGE_URL = STATIC_COVER_IMAGES.IMAGE_1;

/**
 * Set of static image URLs for fast O(1) lookup
 */
const STATIC_COVER_IMAGES_SET = new Set<string>(Object.values(STATIC_COVER_IMAGES));

export type TCoverImageType = "local_static" | "uploaded_asset";

export type TCoverImageResult = {
  needsUpload: boolean;
  imageType: TCoverImageType;
  shouldUpdate: boolean;
};

export type TCoverImagePayload = {
  cover_image?: string | null;
  cover_image_url?: string | null;
  cover_image_asset?: string | null;
};

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
 * - Local static images: returned as-is (served from assets folder)
 * - Uploaded assets: processed through getFileURL (adds backend URL)
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

  if (imageType === "local_static") {
    return imageUrl;
  }

  if (imageType === "uploaded_asset") {
    return getFileURL(imageUrl) || imageUrl;
  }

  return imageUrl;
}

/**
 * Analyzes cover image change and determines what action to take
 */
export const analyzeCoverImageChange = (
  currentImage: string | null | undefined,
  newImage: string | null | undefined
): TCoverImageResult => {
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
): Promise<TCoverImagePayload | null> => {
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
    // For project assets: auto-linked server-side, no payload needed
    // For user assets: return URL for immediate UI feedback

    if (uploadConfig.isUserAsset) {
      return {
        cover_image_url: uploadedUrl,
      };
    } else {
      return null;
    }
  }

  return null;
};

/**
 * Returns a random cover image from the STATIC_COVER_IMAGES object
 * @returns {string} A random cover image URL
 */
export const getRandomCoverImage = (): string =>
  Object.values(STATIC_COVER_IMAGES)[Math.floor(Math.random() * Object.keys(STATIC_COVER_IMAGES).length)];
