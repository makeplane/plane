// types
import { TPage } from "@plane/types";
// services
import { API_BASE_URL, APIService } from "@/core/services/api.service";

export class PageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchDetails(workspaceSlug: string, projectId: string, pageId: string, cookie: string): Promise<TPage> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`, {
      headers: {
        Cookie: cookie,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchDescriptionBinary(workspaceSlug: string, projectId: string, pageId: string, cookie: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/description/`, {
      headers: {
        "Content-Type": "application/octet-stream",
        Cookie: cookie,
      },
      responseType: "arraybuffer",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateTitle(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    data: {
      name: string;
    },
    cookie: string,
    abortSignal?: AbortSignal
  ): Promise<any> {
    console.log("aaya update call", data);

    // Early abort check
    if (abortSignal?.aborted) {
      console.log(`Title update was already aborted before starting: ${pageId}`);
      throw new DOMException("Aborted", "AbortError");
    }

    // Create an abort listener that will reject the pending promise
    let abortListener: (() => void) | undefined;
    const abortPromise = new Promise((_, reject) => {
      if (abortSignal) {
        abortListener = () => {
          console.log(`Title update aborted during execution: ${pageId}`);
          reject(new DOMException("Aborted", "AbortError"));
        };
        abortSignal.addEventListener("abort", abortListener);
      }
    });

    try {
      // The simulated delay that can be aborted
      // await Promise.race([
      //   new Promise((resolve) => setTimeout(resolve, 10000)),
      //   abortPromise
      // ]);

      // The actual API call that can be aborted
      return await Promise.race([
        this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`, data, {
          headers: {
            Cookie: cookie,
          },
          signal: abortSignal,
        })
          .then((response) => response?.data)
          .catch((error) => {
            // Special handling for aborted fetch requests
            if (error.name === "AbortError") {
              console.log(`Fetch request for title update was aborted: ${pageId}`);
              throw new DOMException("Aborted", "AbortError");
            }
            throw error;
          }),
        abortPromise,
      ]);
    } finally {
      // Clean up abort listener
      if (abortSignal && abortListener) {
        abortSignal.removeEventListener("abort", abortListener);
      }
    }
  }

  async updateDescription(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    data: {
      description_binary: string;
      description_html: string;
      description: object;
      name: string;
    },
    cookie: string
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/description/`, data, {
      headers: {
        Cookie: cookie,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }
}
