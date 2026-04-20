/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IProject } from "@plane/types";

const SCHEMA_VERSION = "1";
const CACHE_EXPIRY_HOURS = 24;

interface CachedProject {
  data: IProject;
  timestamp: number;
  schemaVersion: string;
}

export class ProjectCacheService {
  private getCacheKey(projectId: string): string {
    return `plane_project_cache_${projectId}`;
  }

  private isExpired(timestamp: number): boolean {
    const now = Date.now();
    const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
    return now - timestamp > expiryTime;
  }

  getProject(projectId: string): IProject | null {
    if (typeof window === "undefined") return null;

    try {
      const cached = localStorage.getItem(this.getCacheKey(projectId));
      if (!cached) return null;

      const parsed: CachedProject = JSON.parse(cached);

      // Validate schema version
      if (parsed.schemaVersion !== SCHEMA_VERSION) return null;

      // Check if expired
      if (this.isExpired(parsed.timestamp)) {
        this.clearProject(projectId);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  }

  setProject(projectId: string, project: IProject): void {
    if (typeof window === "undefined") return;

    try {
      const cache: CachedProject = {
        data: project,
        timestamp: Date.now(),
        schemaVersion: SCHEMA_VERSION,
      };
      localStorage.setItem(this.getCacheKey(projectId), JSON.stringify(cache));
    } catch {
      // Silently fail if localStorage is full
    }
  }

  clearProject(projectId: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(this.getCacheKey(projectId));
    } catch {
      // Silently fail
    }
  }

  clearAll(): void {
    if (typeof window === "undefined") return;
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("plane_project_cache_")) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Silently fail
    }
  }
}

export const projectCacheService = new ProjectCacheService();
