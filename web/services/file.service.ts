// services
import APIService from "services/api.service";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

interface UnSplashImage {
  id: string;
  created_at: Date;
  updated_at: Date;
  promoted_at: Date;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: null;
  alt_description: string;
  urls: UnSplashImageUrls;
  [key: string]: any;
}

interface UnSplashImageUrls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
  small_s3: string;
}

class FileServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async uploadFile(workspaceSlug: string, file: FormData): Promise<any> {
    return this.mediaUpload(`/api/workspaces/${workspaceSlug}/file-assets/`, file)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteImage(assetUrlWithWorkspaceId: string): Promise<any> {
    return this.delete(`/api/workspaces/file-assets/${assetUrlWithWorkspaceId}/`)
      .then((response) => response?.status)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteFile(workspaceId: string, assetUrl: string): Promise<any> {
    const lastIndex = assetUrl.lastIndexOf("/");
    const assetId = assetUrl.substring(lastIndex + 1);

    return this.delete(`/api/workspaces/file-assets/${workspaceId}/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async uploadUserFile(file: FormData): Promise<any> {
    return this.mediaUpload(`/api/users/file-assets/`, file)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteUserFile(assetUrl: string): Promise<any> {
    const lastIndex = assetUrl.lastIndexOf("/");
    const assetId = assetUrl.substring(lastIndex + 1);

    return this.delete(`/api/users/file-assets/${assetId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUnsplashImages(page: number = 1, query?: string): Promise<UnSplashImage[]> {
    const url = "/api/unsplash";

    return this.request({
      method: "get",
      url,
      params: {
        page,
        per_page: 20,
        query,
      },
    })
      .then((response) => response?.data?.results ?? response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new FileServices();
