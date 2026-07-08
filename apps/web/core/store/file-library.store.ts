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
import type { TFileCategory, TLibraryFile, TLibraryFileFilters } from "@plane/types";
// services
import { FileLibraryService } from "@/services/file-library.service";
// store
import type { CoreRootStore } from "@/store/root.store";

export interface IFileLibraryStore {
  // observables
  categoriesMap: Record<string, TFileCategory>;
  filesMap: Record<string, TLibraryFile>;
  filters: TLibraryFileFilters;
  categoriesLoader: boolean;
  filesLoader: boolean;
  // computed
  categoryIds: string[];
  fileIds: string[];
  // computed fns
  getCategoryById: (categoryId: string) => TFileCategory | undefined;
  getFileById: (fileId: string) => TLibraryFile | undefined;
  getFilteredFileIds: () => string[];
  // actions
  setFilters: (filters: TLibraryFileFilters) => void;
  fetchCategories: (workspaceSlug: string) => Promise<void>;
  createCategory: (workspaceSlug: string, data: Partial<TFileCategory>) => Promise<TFileCategory>;
  updateCategory: (workspaceSlug: string, categoryId: string, data: Partial<TFileCategory>) => Promise<TFileCategory>;
  deleteCategory: (workspaceSlug: string, categoryId: string) => Promise<void>;
  fetchFiles: (workspaceSlug: string) => Promise<void>;
  uploadFile: (
    workspaceSlug: string,
    file: File,
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"]
  ) => Promise<TLibraryFile>;
  deleteFile: (workspaceSlug: string, fileId: string) => Promise<void>;
  addFileCategories: (workspaceSlug: string, fileId: string, categoryIds: string[]) => Promise<void>;
  removeFileCategory: (workspaceSlug: string, fileId: string, categoryId: string) => Promise<void>;
  // url helpers
  getFileViewUrl: (workspaceSlug: string, fileId: string) => string;
  getFileDownloadUrl: (workspaceSlug: string, fileId: string) => string;
  getPresignedViewUrl: (workspaceSlug: string, fileId: string) => Promise<string>;
}

export class FileLibraryStore implements IFileLibraryStore {
  // observables
  categoriesMap: Record<string, TFileCategory> = {};
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
      filesMap: observable,
      filters: observable,
      categoriesLoader: observable.ref,
      filesLoader: observable.ref,
      // computed
      categoryIds: computed,
      fileIds: computed,
      // actions
      setFilters: action,
      fetchCategories: action,
      createCategory: action,
      updateCategory: action,
      deleteCategory: action,
      fetchFiles: action,
      uploadFile: action,
      deleteFile: action,
      addFileCategories: action,
      removeFileCategory: action,
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

  // computed fns
  getCategoryById = computedFn((categoryId: string) => this.categoriesMap[categoryId]);

  getFileById = computedFn((fileId: string) => this.filesMap[fileId]);

  getFilteredFileIds = computedFn(() => {
    const { category, search, type } = this.filters;
    return Object.values(this.filesMap)
      .filter((file) => {
        if (category === "none" && file.category_ids.length > 0) return false;
        if (category && category !== "none" && !file.category_ids.includes(category)) return false;
        if (search && !file.attributes.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (type && !file.attributes.type.toLowerCase().startsWith(type.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((file) => file.id);
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
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"]
  ) => {
    const response = await this.fileLibraryService.uploadFile(workspaceSlug, file, uploadProgressHandler);
    const uploadedFile: TLibraryFile = { ...response.asset, is_uploaded: true };
    runInAction(() => {
      set(this.filesMap, [uploadedFile.id], uploadedFile);
    });
    return uploadedFile;
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
