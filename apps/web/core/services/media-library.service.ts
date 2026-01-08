import { API_BASE_URL } from "@plane/constants";

import { APIService } from "@/services/api.service";

export type TMediaArtifact = {
  name: string;
  title: string;
  format: string;
  path: string;
  link: string | null;
  action: string;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type TMediaLibraryManifest = {
  id?: string;
  artifacts?: TMediaArtifact[];
};

type TMediaLibraryPackagePayload = {
  id?: string;
  name: string;
  title: string;
};

export class MediaLibraryService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async ensureProjectLibrary(
    workspaceSlug: string,
    projectId: string
  ): Promise<TMediaLibraryManifest | null> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/`)
      .then((response) => response?.data ?? null)
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async ensurePackage(
    workspaceSlug: string,
    projectId: string,
    data: TMediaLibraryPackagePayload
  ): Promise<Record<string, unknown> | null> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/packages/`, data)
      .then((response) => response?.data ?? null)
      .catch((error) => {
        if (error?.response?.status === 409) {
          return null;
        }
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async getArtifacts(
    workspaceSlug: string,
    projectId: string,
    packageId: string
  ): Promise<TMediaArtifact[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/packages/${packageId}/artifacts/`
    )
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }
}
