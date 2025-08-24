// types
import { TDocumentPayload } from "@plane/types";
// services
import { API_BASE_URL, APIService } from "@/core/services/api.service";
import { env } from "@/env";

// Base params interface
export type IBasePageParams<TConfig extends Record<string, any> = Record<string, any>> = {
  pageId: string;
  cookie?: string;
  config: TConfig;
};

export type IFetchDetailsParams<TConfig extends Record<string, any> = Record<string, any>> = IBasePageParams<TConfig>;

export type IUpdateTitleParams<TConfig extends Record<string, any> = Record<string, any>> = IBasePageParams<TConfig> & {
  data: { name: string };
  abortSignal?: AbortSignal;
};

export type IUpdateDescriptionParams<TConfig extends Record<string, any> = Record<string, any>> =
  IBasePageParams<TConfig> & {
    data: TDocumentPayload;
  };

export abstract class BasePageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Gets the base URL path for API requests based on the context (workspace, project, teamspace)
   */
  protected abstract getBasePath(_params: Record<string, any>): string;

  /**
   * Gets the common headers used for requests
   */
  protected getHeaders(params: { cookie?: string; isBinary?: boolean }): Record<string, string> {
    const { cookie, isBinary = false } = params;
    const headers: Record<string, string> = {};

    if (cookie) {
      headers.Cookie = cookie;
    }

    if (env.LIVE_SERVER_SECRET_KEY) {
      headers["live-server-secret-key"] = env.LIVE_SERVER_SECRET_KEY;
    }

    if (isBinary) {
      headers["Content-Type"] = "application/octet-stream";
    }

    return headers;
  }

  /**
   * Fetches page details
   */
  async fetchDetails<TConfig extends Record<string, any>>(params: IFetchDetailsParams<TConfig>) {
    const { pageId, cookie, config } = params;
    return this.get(`${this.getBasePath({ pageId, cookie, config })}/`, {
      headers: this.getHeaders({ cookie }),
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetches binary description data for a page
   */
  async fetchDescriptionBinary<TConfig extends Record<string, any>>(params: IFetchDetailsParams<TConfig>) {
    const { pageId, cookie, config } = params;
    return this.get(`${this.getBasePath({ pageId, cookie, config })}/description/`, {
      headers: this.getHeaders({ cookie: cookie, isBinary: true }),
      responseType: "arraybuffer",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  /**
   * Updates the title of a page
   */
  async updateTitle<TConfig extends Record<string, any>>(params: IUpdateTitleParams<TConfig>) {
    const { config, pageId, data, cookie, abortSignal } = params;

    // Early abort check
    if (abortSignal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    // Create an abort listener that will reject the pending promise
    let abortListener: (() => void) | undefined;
    const abortPromise = new Promise((_, reject) => {
      if (abortSignal) {
        abortListener = () => {
          reject(new DOMException("Aborted", "AbortError"));
        };
        abortSignal.addEventListener("abort", abortListener);
      }
    });

    try {
      return await Promise.race([
        this.patch(`${this.getBasePath({ pageId, cookie, config })}/`, data, {
          headers: this.getHeaders({ cookie }),
          signal: abortSignal,
        })
          .then((response) => response?.data)
          .catch((error) => {
            if (error.name === "AbortError") {
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

  /**
   * Updates the description of a page
   */
  async updateDescription<TConfig extends Record<string, unknown>>(params: IUpdateDescriptionParams<TConfig>) {
    const { pageId, data, cookie, config } = params;

    return this.patch(`${this.getBasePath({ pageId, cookie, config })}/description/`, data, {
      headers: this.getHeaders({ cookie }),
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  /**
   * Fetches sub-pages of a page
   */
  async fetchSubPageDetails<TConfig extends Record<string, any>>(params: IFetchDetailsParams<TConfig>) {
    const { pageId, cookie, config } = params;
    return this.get(`${this.getBasePath({ pageId, cookie, config })}/sub-pages/`, {
      headers: this.getHeaders({ cookie: cookie }),
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
