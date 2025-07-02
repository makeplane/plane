// helpers
import { TApplicationCategory } from "@plane/types";
import { API_BASE_URL  } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export class CategoryService extends APIService {
    constructor() {
        super(API_BASE_URL);
    }

    /**
     * Get all application categories
     * @returns The application categories
     */
    async getApplicationCategories(): Promise<TApplicationCategory[] | undefined> {
        return this.get(`/marketplace/application-categories/`)
            .then((res) => res?.data)
            .catch((err) => {
                throw err?.response?.data;
            });
    }
}