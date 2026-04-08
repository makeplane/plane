/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { Download, Search, Upload } from "lucide-react";
import { Button, getButtonStyling } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { PageWrapper } from "@/components/common/page-wrapper";
import { useInstanceStaff, useInstanceDepartment } from "@/hooks/store";
import { StaffTable } from "./components/staff-table";
import { StaffFormModal } from "./components/staff-form-modal";
import { StaffImportModal } from "./components/staff-import-modal";

const StaffPage = observer(function StaffPage() {
  const { stats, staffIds, fetchStaff, fetchStats } = useInstanceStaff();
  const { fetchDepartments } = useInstanceDepartment();
  const [editStaffId, setEditStaffId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const { departments, departmentIds } = useInstanceDepartment();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useSWR("INSTANCE_STAFF", () => fetchStaff());
  useSWR("INSTANCE_STAFF_STATS", () => fetchStats());
  useSWR("INSTANCE_DEPARTMENTS", () => fetchDepartments());

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetchStaff({ search: value, status: filterStatus || undefined, department: filterDept || undefined });
      }, 300);
    },
    [fetchStaff, filterStatus, filterDept]
  );

  const handleFilterChange = (status: string, dept: string) => {
    void fetchStaff({ status: status || undefined, department: dept || undefined });
  };

  const handleExport = async () => {
    try {
      const { InstanceStaffService } = await import("@plane/services");
      const svc = new InstanceStaffService();
      const blob = await svc.export();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "staff-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Export failed" });
    }
  };

  return (
    <PageWrapper header={{ title: "Staff", description: "Manage staff profiles across all departments." }}>
      <div className="space-y-4">
        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-5 gap-3 pt-2">
            {(["total", "active", "probation", "resigned", "suspended"] as const).map((key) => (
              <div key={key} className="rounded-lg border border-subtle bg-layer-1 p-3 space-y-1">
                <p className="text-11 text-tertiary uppercase tracking-wide">{key}</p>
                <p className="text-20 font-semibold">{stats[key]}</p>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-placeholder" />
            <Input
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              handleFilterChange(e.target.value, filterDept);
            }}
            className="rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13"
          >
            <option value="">All statuses</option>
            {["active", "probation", "resigned", "suspended", "transferred"].map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={filterDept}
            onChange={(e) => {
              setFilterDept(e.target.value);
              handleFilterChange(filterStatus, e.target.value);
            }}
            className="rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13"
          >
            <option value="">All departments</option>
            {departmentIds.map((id) => (
              <option key={id} value={id}>
                {departments[id]?.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4" /> Import
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void handleExport()}>
              <Download className="w-4 h-4" /> Export
            </Button>
            <Link href="/staff/create" className={getButtonStyling("primary", "sm")}>
              Add Staff
            </Link>
          </div>
        </div>

        {/* Count */}
        <div className="text-14 font-medium">
          All staff <span className="text-tertiary">• {staffIds.length}</span>
        </div>

        <StaffTable onEdit={(id) => setEditStaffId(id)} />
      </div>

      <StaffFormModal open={!!editStaffId} onClose={() => setEditStaffId(null)} staffId={editStaffId} />
      <StaffImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </PageWrapper>
  );
});

export function meta() {
  return [{ title: "Staff - God Mode" }];
}

export default StaffPage;
