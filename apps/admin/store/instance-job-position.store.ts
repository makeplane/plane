/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { JobPositionService } from "@plane/services";
import type {
  IJobGrade,
  IJobGradeCreate,
  IJobGradeUpdate,
  IJobPosition,
  IJobPositionCreate,
  IJobPositionUpdate,
  IJobPositionBulkImportRequest,
  IJobPositionBulkImportResponse,
} from "@plane/types";
import type { TLoader } from "@plane/types";

export interface IInstanceJobPositionStore {
  // observables
  loader: TLoader;
  hasFetched: boolean;
  grades: Record<string, IJobGrade>;
  positions: Record<string, IJobPosition>;
  // computed
  gradeIds: string[];
  // actions
  getPositionsByGrade: (gradeId: string) => IJobPosition[];
  fetchAll: () => Promise<void>;
  createGrade: (data: IJobGradeCreate) => Promise<IJobGrade>;
  updateGrade: (id: string, data: IJobGradeUpdate) => Promise<IJobGrade>;
  deleteGrade: (id: string) => Promise<void>;
  createPosition: (data: IJobPositionCreate) => Promise<IJobPosition>;
  updatePosition: (id: string, data: IJobPositionUpdate) => Promise<IJobPosition>;
  deletePosition: (id: string) => Promise<void>;
  bulkImport: (data: IJobPositionBulkImportRequest) => Promise<IJobPositionBulkImportResponse>;
}

export class InstanceJobPositionStore implements IInstanceJobPositionStore {
  loader: TLoader = undefined;
  hasFetched: boolean = false;
  grades: Record<string, IJobGrade> = {};
  positions: Record<string, IJobPosition> = {};

  private service: JobPositionService;

  constructor() {
    this.service = new JobPositionService();

    makeObservable(this, {
      loader: observable,
      hasFetched: observable,
      grades: observable,
      positions: observable,
      gradeIds: computed,
      fetchAll: action,
      createGrade: action,
      updateGrade: action,
      deleteGrade: action,
      createPosition: action,
      updatePosition: action,
      deletePosition: action,
      bulkImport: action,
    });
  }

  get gradeIds(): string[] {
    return Object.keys(this.grades);
  }

  getPositionsByGrade = (gradeId: string): IJobPosition[] =>
    Object.values(this.positions).filter((p) => p.job_grade === gradeId);

  fetchAll = async (): Promise<void> => {
    this.loader = "init-loader";
    try {
      const [grades, positions] = await Promise.all([this.service.listGrades(), this.service.listPositions()]);
      runInAction(() => {
        grades.forEach((g) => set(this.grades, g.id, g));
        positions.forEach((p) => set(this.positions, p.id, p));
        this.hasFetched = true;
      });
    } finally {
      runInAction(() => {
        this.loader = undefined;
      });
    }
  };

  createGrade = async (data: IJobGradeCreate): Promise<IJobGrade> => {
    const created = await this.service.createGrade(data);
    runInAction(() => {
      set(this.grades, created.id, created);
    });
    return created;
  };

  updateGrade = async (id: string, data: IJobGradeUpdate): Promise<IJobGrade> => {
    const updated = await this.service.updateGrade(id, data);
    runInAction(() => {
      set(this.grades, id, updated);
    });
    return updated;
  };

  deleteGrade = async (id: string): Promise<void> => {
    await this.service.deleteGrade(id);
    runInAction(() => {
      delete this.grades[id];
    });
  };

  createPosition = async (data: IJobPositionCreate): Promise<IJobPosition> => {
    const created = await this.service.createPosition(data);
    runInAction(() => {
      set(this.positions, created.id, created);
    });
    return created;
  };

  updatePosition = async (id: string, data: IJobPositionUpdate): Promise<IJobPosition> => {
    const updated = await this.service.updatePosition(id, data);
    runInAction(() => {
      set(this.positions, id, updated);
    });
    return updated;
  };

  deletePosition = async (id: string): Promise<void> => {
    await this.service.deletePosition(id);
    runInAction(() => {
      delete this.positions[id];
    });
  };

  bulkImport = async (data: IJobPositionBulkImportRequest): Promise<IJobPositionBulkImportResponse> => {
    const result = await this.service.bulkImport(data);
    runInAction(() => {
      result.grade_created.forEach((g) => set(this.grades, g.id, g));
      result.position_created.forEach((p) => set(this.positions, p.id, p));
    });
    return result;
  };
}
