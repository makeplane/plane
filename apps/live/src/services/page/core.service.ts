import { TPage } from "@plane/types";
// services
import { APIService } from "../api.service";

export type TPageDescriptionPayload = {
  description_binary: string;
  description_html: string;
  description: object;
};

export abstract class PageCoreService extends APIService {
  protected abstract basePath: string;

  constructor() {
    super();
  }

  async fetchDetails(pageId: string): Promise<TPage> {
    return this.get(`${this.basePath}/pages/${pageId}/`, {
      headers: this.getHeader(),
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchDescriptionBinary(pageId: string): Promise<any> {
    return this.get(`${this.basePath}/pages/${pageId}/description/`, {
      headers: {
        ...this.getHeader(),
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateDescriptionBinary(pageId: string, data: TPageDescriptionPayload): Promise<any> {
    return this.patch(`${this.basePath}/pages/${pageId}/description/`, data, {
      headers: this.getHeader(),
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }
}
