// services
import APIService from "services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

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
}

export default new FileServices();
