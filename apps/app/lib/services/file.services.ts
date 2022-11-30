// api routes
import { S3_URL } from "constants/api-routes";
// services
import APIService from "lib/services/api.service";

class FileServices extends APIService {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async uploadFile(file: FormData): Promise<any> {
    return this.mediaUpload(S3_URL, file)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new FileServices();
