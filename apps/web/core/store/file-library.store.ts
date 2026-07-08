/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { AxiosRequestConfig } from "axios";
import { set, unset } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type {
  TFileCategory,
  TFileFolder,
  TFileTag,
  TLibraryBulkAction,
  TLibraryFile,
  TLibraryFileFilters,
} from "@plane/types";
// services
import { FileLibraryService } from "@/services/file-library.service";
// store
import type { CoreRootStore } from "@/store/root.store";

export interface IFileLibraryStore {
  // observables
  categoriesMap: Record<string, TFileCategory>;
  foldersMap: Record<string, TFileFolder>;
  tagsMap: Record<string, TFileTag>;
  filesMap: Record<string, TLibraryFile>;
  filters: TLibraryFileFilters;
  categoriesLoader: boolean;
  filesLoader: boolean;
  // computed
  categoryIds: string[];
  folderIds: string[];
  tagIds: string[];
  fileIds: string[];
  // computed fns
  getCategoryById: (categoryId: string) => TFileCategory | undefined;
  getFolderById: (folderId: string) => TFileFolder | undefined;
  getTagById: (tagId: string) => TFileTag | undefined;
  getFileById: (fileId: string) => TLibraryFile | undefined;
  getFilteredFileIds: () => string[];
  getFolderPath: (folderId: string | null) => TFileFolder[];
  // actions
  setFilters: (filters: TLibraryFileFilters) => void;
  fetchCategories: (workspaceSlug: string) => Promise<void>;
  createCategory: (workspaceSlug: string, data: Partial<TFileCategory>) => Promise<TFileCategory>;
  updateCategory: (workspaceSlug: string, categoryId: string, data: Partial<TFileCategory>) => Promise<TFileCategory>;
  deleteCategory: (workspaceSlug: string, categoryId: string) => Promise<void>;
  fetchFolders: (workspaceSlug: string) => Promise<void>;
  createFolder: (workspaceSlug: string, data: Partial<TFileFolder>) => Promise<TFileFolder>;
  updateFolder: (workspaceSlug: string, folderId: string, data: Partial<TFileFolder>) => Promise<TFileFolder>;
  deleteFolder: (workspaceSlug: string, folderId: string) => Promise<void>;
  fetchTags: (workspaceSlug: string) => Promise<void>;
  createTag: (workspaceSlug: string, data: Partial<TFileTag>) => Promise<TFileTag>;
  updateTag: (workspaceSlug: string, tagId: string, data: Partial<TFileTag>) => Promise<TFileTag>;
  deleteTag: (workspaceSlug: string, tagId: string) => Promise<void>;
  fetchFiles: (workspaceSlug: string) => Promise<void>;
  uploadFile: (
    workspaceSlug: string,
    file: File,
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"],
    folderId?: string | null
  ) => Promise<TLibraryFile>;
  deleteFile: (workspaceSlug: string, fileId: string) => Promise<void>;
  addFileCategories: (workspaceSlug: string, fileId: string, categoryIds: string[]) => Promise<void>;
  removeFileCategory: (workspaceSlug: string, fileId: string, categoryId: string) => Promise<void>;
  addFileTags: (workspaceSlug: string, fileId: string, tagIds: string[]) => Promise<void>;
  removeFileTag: (workspaceSlug: string, fileId: string, tagId: string) => Promise<void>;
  bulkAction: (workspaceSlug: string, payload: TLibraryBulkAction) => Promise<{ status: string; skipped?: string[] }>;
  // url helpers
  getFileViewUrl: (workspaceSlug: string, fileId: string) => string;
  getFileDownloadUrl: (workspaceSlug: string, fileId: string) => string;
  getPresignedViewUrl: (workspaceSlug: string, fileId: string) => Promise<string>;
}

export class FileLibraryStore implements IFileLibraryStore {
  // observables
  categoriesMap: Record<string, TFileCategory> = {};
  foldersMap: Record<string, TFileFolder> = {};
  tagsMap: Record<string, TFileTag> = {};
  filesMap: Record<string, TLibraryFile> = {};
  filters: TLibraryFileFilters = {};
  categoriesLoader = false;
  filesLoader = false;
  // services
  fileLibraryService: FileLibraryService;

  constructor(private rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      categoriesMap: observable,
      foldersMap: observable,
      tagsMap: observable,
      filesMap: observable,
      filters: observable,
      categoriesLoader: observable.ref,
      filesLoader: observable.ref,
      // computed
      categoryIds: computed,
      folderIds: computed,
      tagIds: computed,
      fileIds: computed,
      // actions
      setFilters: action,
      fetchCategories: action,
      createCategory: action,
      updateCategory: action,
      deleteCategory: action,
      fetchFolders: action,
      createFolder: action,
      updateFolder: action,
      deleteFolder: action,
      fetchTags: action,
      createTag: action,
      updateTag: action,
      deleteTag: action,
      fetchFiles: action,
      uploadFile: action,
      deleteFile: action,
      addFileCategories: action,
      removeFileCategory: action,
      addFileTags: action,
      removeFileTag: action,
      bulkAction: action,
    });
    this.fileLibraryService = new FileLibraryService();
  }

  // computed
  get categoryIds() {
    // Object.values() returns a fresh array each call, so sorting it in place is safe
    return Object.values(this.categoriesMap)
      .sort((a, b) => Number(b.is_default) - Number(a.is_default) || a.name.localeCompare(b.name))
      .map((category) => category.id);
  }

  get fileIds() {
    return Object.values(this.filesMap)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((file) => file.id);
  }

  get folderIds() {
    return Object.values(this.foldersMap)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((folder) => folder.id);
  }

  get tagIds() {
    return Object.values(this.tagsMap)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((tag) => tag.id);
  }

  // computed fns
  getCategoryById = computedFn((categoryId: string) => this.categoriesMap[categoryId]);

  getFolderById = computedFn((folderId: string) => this.foldersMap[folderId]);

  getTagById = computedFn((tagId: string) => this.tagsMap[tagId]);

  getFileById = computedFn((fileId: string) => this.filesMap[fileId]);

  getFilteredFileIds = computedFn(() => {
    const { category, tag, search, type } = this.filters;
    return Object.values(this.filesMap)
      .filter((file) => {
        if (category === "none" && file.category_ids.length > 0) return false;
        if (category && category !== "none" && !file.category_ids.includes(category)) return false;
        if (tag && !file.tag_ids.includes(tag)) return false;
        if (search && !file.attributes.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (type && !file.attributes.type.toLowerCase().startsWith(type.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((file) => file.id);
  });

  /** Trail from the root down to the given folder (empty for the root). */
  getFolderPath = computedFn((folderId: string | null) => {
    const path: TFileFolder[] = [];
    let current = folderId ? this.foldersMap[folderId] : undefined;
    while (current) {
      path.unshift(current);
      current = current.parent ? this.foldersMap[current.parent] : undefined;
    }
    return path;
  });

  // actions
  setFilters = (filters: TLibraryFileFilters) => {
    this.filters = { ...this.filters, ...filters };
  };

  fetchCategories = async (workspaceSlug: string) => {
    try {
      this.categoriesLoader = true;
      const categories = await this.fileLibraryService.getCategories(workspaceSlug);
      runInAction(() => {
        this.categoriesMap = {};
        categories.forEach((category) => set(this.categoriesMap, [category.id], category));
      });
    } finally {
      this.categoriesLoader = false;
    }
  };

  createCategory = async (workspaceSlug: string, data: Partial<TFileCategory>) => {
    const category = await this.fileLibraryService.createCategory(workspaceSlug, data);
    runInAction(() => {
      set(this.categoriesMap, [category.id], category);
    });
    return category;
  };

  updateCategory = async (workspaceSlug: string, categoryId: string, data: Partial<TFileCategory>) => {
    const category = await this.fileLibraryService.updateCategory(workspaceSlug, categoryId, data);
    runInAction(() => {
      set(this.categoriesMap, [category.id], category);
    });
    return category;
  };

  deleteCategory = async (workspaceSlug: string, categoryId: string) => {
    await this.fileLibraryService.deleteCategory(workspaceSlug, categoryId);
    runInAction(() => {
      unset(this.categoriesMap, [categoryId]);
      // deleting a category only unlinks files
      Object.values(this.filesMap).forEach((file) => {
        if (file.category_ids.includes(categoryId)) {
          set(
            this.filesMap,
            [file.id, "category_ids"],
            file.category_ids.filter((id) => id !== categoryId)
          );
        }
      });
    });
  };

  fetchFiles = async (workspaceSlug: string) => {
    try {
      this.filesLoader = true;
      const files = await this.fileLibraryService.getFiles(workspaceSlug);
      runInAction(() => {
        this.filesMap = {};
        files.forEach((file) => set(this.filesMap, [file.id], file));
      });
    } finally {
      this.filesLoader = false;
    }
  };

  uploadFile = async (
    workspaceSlug: string,
    file: File,
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"],
    folderId?: string | null
  ) => {
    const response = await this.fileLibraryService.uploadFile(workspaceSlug, file, uploadProgressHandler, folderId);
    const uploadedFile: TLibraryFile = { ...response.asset, is_uploaded: true };
    runInAction(() => {
      set(this.filesMap, [uploadedFile.id], uploadedFile);
    });
    return uploadedFile;
  };

  // folders

  fetchFolders = async (workspaceSlug: string) => {
    const folders = await this.fileLibraryService.getFolders(workspaceSlug);
    runInAction(() => {
      this.foldersMap = {};
      folders.forEach((folder) => set(this.foldersMap, [folder.id], folder));
    });
  };

  createFolder = async (workspaceSlug: string, data: Partial<TFileFolder>) => {
    const folder = await this.fileLibraryService.createFolder(workspaceSlug, data);
    runInAction(() => {
      set(this.foldersMap, [folder.id], folder);
    });
    return folder;
  };

  updateFolder = async (workspaceSlug: string, folderId: string, data: Partial<TFileFolder>) => {
    const folder = await this.fileLibraryService.updateFolder(workspaceSlug, folderId, data);
    runInAction(() => {
      set(this.foldersMap, [folder.id], folder);
    });
    return folder;
  };

  deleteFolder = async (workspaceSlug: string, folderId: string) => {
    await this.fileLibraryService.deleteFolder(workspaceSlug, folderId);
    // Children and files were re-parented server-side; refetch to stay in sync
    await Promise.all([this.fetchFolders(workspaceSlug), this.fetchFiles(workspaceSlug)]);
  };

  // tags

  fetchTags = async (workspaceSlug: string) => {
    const tags = await this.fileLibraryService.getTags(workspaceSlug);
    runInAction(() => {
      this.tagsMap = {};
      tags.forEach((tag) => set(this.tagsMap, [tag.id], tag));
    });
  };

  createTag = async (workspaceSlug: string, data: Partial<TFileTag>) => {
    const tag = await this.fileLibraryService.createTag(workspaceSlug, data);
    runInAction(() => {
      set(this.tagsMap, [tag.id], tag);
    });
    return tag;
  };

  updateTag = async (workspaceSlug: string, tagId: string, data: Partial<TFileTag>) => {
    const tag = await this.fileLibraryService.updateTag(workspaceSlug, tagId, data);
    runInAction(() => {
      set(this.tagsMap, [tag.id], tag);
    });
    return tag;
  };

  deleteTag = async (workspaceSlug: string, tagId: string) => {
    await this.fileLibraryService.deleteTag(workspaceSlug, tagId);
    runInAction(() => {
      unset(this.tagsMap, [tagId]);
      Object.values(this.filesMap).forEach((file) => {
        if (file.tag_ids.includes(tagId)) {
          set(
            this.filesMap,
            [file.id, "tag_ids"],
            file.tag_ids.filter((id) => id !== tagId)
          );
        }
      });
    });
  };

  addFileTags = async (workspaceSlug: string, fileId: string, tagIds: string[]) => {
    const updated = await this.fileLibraryService.addFileTags(workspaceSlug, fileId, tagIds);
    runInAction(() => {
      set(this.filesMap, [fileId, "tag_ids"], updated.tag_ids);
    });
  };

  removeFileTag = async (workspaceSlug: string, fileId: string, tagId: string) => {
    await this.fileLibraryService.removeFileTag(workspaceSlug, fileId, tagId);
    runInAction(() => {
      const file = this.filesMap[fileId];
      if (file) {
        set(
          this.filesMap,
          [fileId, "tag_ids"],
          file.tag_ids.filter((id) => id !== tagId)
        );
      }
    });
  };

  bulkAction = async (workspaceSlug: string, payload: TLibraryBulkAction) => {
    const result = await this.fileLibraryService.bulkAction(workspaceSlug, payload);
    // Bulk operations touch many rows at once; refetching keeps every count
    // and relation consistent in one round trip
    await Promise.all([this.fetchFiles(workspaceSlug), this.fetchFolders(workspaceSlug)]);
    return result;
  };

  deleteFile = async (workspaceSlug: string, fileId: string) => {
    await this.fileLibraryService.deleteFile(workspaceSlug, fileId);
    runInAction(() => {
      unset(this.filesMap, [fileId]);
    });
  };

  addFileCategories = async (workspaceSlug: string, fileId: string, categoryIds: string[]) => {
    const updated = await this.fileLibraryService.addFileCategories(workspaceSlug, fileId, categoryIds);
    runInAction(() => {
      set(this.filesMap, [fileId, "category_ids"], updated.category_ids);
      // refresh category counts lazily
      categoryIds.forEach((categoryId) => {
        const category = this.categoriesMap[categoryId];
        if (category) set(this.categoriesMap, [categoryId, "file_count"], category.file_count + 1);
      });
    });
  };

  removeFileCategory = async (workspaceSlug: string, fileId: string, categoryId: string) => {
    await this.fileLibraryService.removeFileCategory(workspaceSlug, fileId, categoryId);
    runInAction(() => {
      const file = this.filesMap[fileId];
      if (file) {
        set(
          this.filesMap,
          [fileId, "category_ids"],
          file.category_ids.filter((id) => id !== categoryId)
        );
      }
      const category = this.categoriesMap[categoryId];
      if (category) set(this.categoriesMap, [categoryId, "file_count"], Math.max(0, category.file_count - 1));
    });
  };

  // url helpers
  getFileViewUrl = (workspaceSlug: string, fileId: string) =>
    this.fileLibraryService.getFileViewUrl(workspaceSlug, fileId);

  getFileDownloadUrl = (workspaceSlug: string, fileId: string) =>
    this.fileLibraryService.getFileDownloadUrl(workspaceSlug, fileId);

  getPresignedViewUrl = (workspaceSlug: string, fileId: string) =>
    this.fileLibraryService.getPresignedViewUrl(workspaceSlug, fileId);
}
