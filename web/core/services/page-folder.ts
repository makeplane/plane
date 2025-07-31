import { API_BASE_URL } from "@/helpers/common.helper";
import { TPageFolder } from "@plane/types";

export class PageFolderService {
  async fetchAll(workspaceSlug: string, projectId: string): Promise<TPageFolder[]> {
    const response = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/page-folders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch page folders");
    }

    return response.json();
  }

  async fetchById(workspaceSlug: string, projectId: string, folderId: string): Promise<TPageFolder> {
    const response = await fetch(
      `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/page-folders/${folderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch page folder");
    }

    return response.json();
  }

  async create(workspaceSlug: string, projectId: string, folderData: Partial<TPageFolder>): Promise<TPageFolder> {
    const response = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/page-folders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(folderData),
    });

    if (!response.ok) {
      throw new Error("Failed to create page folder");
    }

    return response.json();
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    folderId: string,
    folderData: Partial<TPageFolder>
  ): Promise<TPageFolder> {
    const response = await fetch(
      `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/page-folders/${folderId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(folderData),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update page folder");
    }

    return response.json();
  }

  async remove(workspaceSlug: string, projectId: string, folderId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/page-folders/${folderId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete page folder");
    }
  }

  async addPageToFolder(workspaceSlug: string, projectId: string, folderId: string, pageId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/page-folders/${folderId}/pages/${pageId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to add page to folder");
    }
  }

  async removePageFromFolder(
    workspaceSlug: string,
    projectId: string,
    folderId: string,
    pageId: string
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/page-folders/${folderId}/pages/${pageId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to remove page from folder");
    }
  }
}
