/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Download, Plus, Upload, Loader as LoaderIcon } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Loader } from "@plane/ui";
import type { IJobGrade, IJobPosition } from "@plane/types";
import { PageWrapper } from "@/components/common/page-wrapper";
import { useInstanceJobPosition } from "@/hooks/store";
import { JobGradeList } from "./components/job-grade-list";
import { JobPositionList } from "./components/job-position-list";
import { JobGradeFormModal } from "./components/job-grade-form-modal";
import { JobPositionFormModal } from "./components/job-position-form-modal";
import { JobPositionImportModal } from "./components/job-position-import-modal";

async function exportToExcel(grades: IJobGrade[], positions: IJobPosition[], gradesById: Record<string, IJobGrade>) {
  const XLSX = await import("xlsx");
  const headers = ["type", "grade_name", "name", "description", "sort_order", "is_active"];
  const gradeRows = grades.map((g) => ["grade", "", g.name, g.description ?? "", g.sort_order, g.is_active]);
  const positionRows = positions.map((p) => [
    "position",
    gradesById[p.job_grade]?.name ?? "",
    p.name,
    p.description ?? "",
    p.sort_order,
    p.is_active,
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...gradeRows, ...positionRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Job Positions");
  XLSX.writeFile(wb, "job-positions.xlsx");
}

const JobPositionsPage = observer(function JobPositionsPage() {
  const { loader, fetchAll, grades, positions } = useInstanceJobPosition();

  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editGrade, setEditGrade] = useState<IJobGrade | null>(null);
  const [editPosition, setEditPosition] = useState<IJobPosition | null>(null);

  useSWR("INSTANCE_JOB_POSITIONS", fetchAll);

  const handleEditGrade = (g: IJobGrade) => {
    setEditGrade(g);
    setGradeModalOpen(true);
  };
  const handleEditPosition = (p: IJobPosition) => {
    setEditPosition(p);
    setPositionModalOpen(true);
  };
  const handleGradeModalClose = () => {
    setGradeModalOpen(false);
    setEditGrade(null);
  };
  const handlePositionModalClose = () => {
    setPositionModalOpen(false);
    setEditPosition(null);
  };
  const handleAddPosition = () => {
    setEditPosition(null);
    setPositionModalOpen(true);
  };

  return (
    <PageWrapper header={{ title: "Job Positions", description: "Manage job grades and their positions." }}>
      <div className="space-y-3">
        <div className="pt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-16 font-medium">
            Job Grades & Positions
            {loader === "mutation" && <LoaderIcon className="w-4 h-4 animate-spin text-tertiary" />}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void exportToExcel(Object.values(grades), Object.values(positions), grades)}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </div>
        </div>

        {loader === "init-loader" ? (
          <Loader className="space-y-3 py-4">
            <Loader.Item height="44px" width="100%" />
            <Loader.Item height="44px" width="90%" />
            <Loader.Item height="44px" width="85%" />
          </Loader>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Job Grades (parent) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-13 font-medium text-secondary">Job grades</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditGrade(null);
                    setGradeModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Job Grade
                </Button>
              </div>
              <JobGradeList selectedGradeId={selectedGradeId} onSelect={setSelectedGradeId} onEdit={handleEditGrade} />
            </div>
            {/* Right: Job Positions (child of selected grade) */}
            <div className="space-y-2">
              <JobPositionList
                selectedGradeId={selectedGradeId}
                onEdit={handleEditPosition}
                onAddPosition={handleAddPosition}
              />
            </div>
          </div>
        )}
      </div>

      <JobGradeFormModal open={gradeModalOpen} onClose={handleGradeModalClose} editGrade={editGrade} />
      <JobPositionFormModal
        open={positionModalOpen}
        onClose={handlePositionModalClose}
        editPosition={editPosition}
        defaultGradeId={selectedGradeId}
      />
      <JobPositionImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} />
    </PageWrapper>
  );
});

// eslint-disable-next-line react-refresh/only-export-components
export function meta() {
  return [{ title: "Job Positions - God Mode" }];
}

export default JobPositionsPage;
