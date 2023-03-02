// services
import APIService from "services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

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

  async getUnsplashImages(page: number = 1, query?: string): Promise<UnSplashImage[]> {
    const clientId = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS;
    const url = query
      ? `https://api.unsplash.com/search/photos/?client_id=${clientId}&query=${query}&page=${page}&per_page=20`
      : `https://api.unsplash.com/photos/?client_id=${clientId}&page=${page}&per_page=20`;

    return this.request({
      method: "get",
      url,
    })
      .then((response) => {
        return response?.data?.results ?? response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new FileServices();
