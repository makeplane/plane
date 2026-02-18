/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { Button, Input, Loader } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Download, Plus, Upload } from "lucide-react";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { IStaff } from "@/services/staff.service";
import { StaffService } from "@/services/staff.service";
import { DepartmentService } from "@/services/department.service";
import { StaffWorkspaceSettingsHeader } from "./header";
import { StaffTable } from "./components/staff-table";
import { StaffFormModal } from "./components/staff-form-modal";
import { StaffImportModal } from "./components/staff-import-modal";
import { useParams } from "react-router";

const staffService = new StaffService();
const departmentService = new DepartmentService();

const StaffSettingsPage = observer(function StaffSettingsPage() {
  const { workspaceSlug = "" } = useParams<{ workspaceSlug: string }>();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<IStaff | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const {
    data: staffList,
    isLoading,
    mutate,
  } = useSWR(workspaceSlug ? `STAFF_LIST_${workspaceSlug}` : null, () => staffService.getStaffList(workspaceSlug));

  const { data: stats } = useSWR(workspaceSlug ? `STAFF_STATS_${workspaceSlug}` : null, () =>
    staffService.getStats(workspaceSlug)
  );

  const { data: departments } = useSWR(workspaceSlug ? `DEPARTMENTS_${workspaceSlug}` : null, () =>
    departmentService.getDepartments(workspaceSlug)
  );

  const filteredStaff = staffList?.filter((staff) => {
    const matchesSearch =
      !searchQuery ||
      staff.staff_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = !departmentFilter || staff.department === departmentFilter;
    const matchesStatus = !statusFilter || staff.employment_status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleAddStaff = () => {
    setEditingStaff(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditStaff = (staff: IStaff) => {
    setEditingStaff(staff);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    mutate();
  };

  const handleExport = async () => {
    try {
      const blob = await staffService.exportStaff(workspaceSlug);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `staff-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Export successful",
        message: "Staff data has been exported successfully.",
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Export failed",
        message: error?.message || "Failed to export staff data.",
      });
    }
  };

  return (
    <SettingsContentWrapper header={<StaffWorkspaceSettingsHeader />}>
      <PageHead title={`${currentWorkspace?.name} - Staff`} />

      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Staff Management</h3>
            <p className="mt-1 text-sm text-custom-text-400">Manage your organization&apos;s staff members</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddStaff} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-5 gap-4">
            <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
              <p className="text-xs text-custom-text-400">Total Staff</p>
              <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
            </div>
            <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
              <p className="text-xs text-custom-text-400">Active</p>
              <p className="mt-1 text-2xl font-semibold text-green-600">{stats.active}</p>
            </div>
            <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
              <p className="text-xs text-custom-text-400">Probation</p>
              <p className="mt-1 text-2xl font-semibold text-yellow-600">{stats.probation}</p>
            </div>
            <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
              <p className="text-xs text-custom-text-400">Resigned</p>
              <p className="mt-1 text-2xl font-semibold text-gray-600">{stats.resigned}</p>
            </div>
            <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
              <p className="text-xs text-custom-text-400">Suspended</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">{stats.suspended}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              id="search"
              placeholder="Search by staff ID, name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-48">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm"
            >
              <option value="">All Departments</option>
              {departments?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="resigned">Resigned</option>
              <option value="suspended">Suspended</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <Loader className="space-y-4">
            <Loader.Item height="60px" />
            <Loader.Item height="60px" />
            <Loader.Item height="60px" />
          </Loader>
        ) : (
          <StaffTable
            staff={filteredStaff || []}
            workspaceSlug={workspaceSlug}
            onEdit={handleEditStaff}
            onDelete={mutate}
          />
        )}
      </div>

      <StaffFormModal
        workspaceSlug={workspaceSlug}
        staff={editingStaff}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <StaffImportModal
        workspaceSlug={workspaceSlug}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </SettingsContentWrapper>
  );
});

export default StaffSettingsPage;
