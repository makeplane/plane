import { useState, useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader } from "@plane/ui";
import { SearchIcon } from "@plane/propel/icons";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useMyStaffProfile } from "@/plane-web/hooks/use-my-staff-profile";
import { DepartmentService } from "@/plane-web/services/department.service";
import type { IDepartment } from "@/plane-web/services/department.service";
import { UserService } from "@/services/user.service";
import { HoDepartmentTreeRow } from "./department-tree-row";

const departmentService = new DepartmentService();
const userService = new UserService();

// Recursively find the subtree rooted at the given department id
function findSubtree(nodes: IDepartment[], deptId: string): IDepartment | null {
  for (const node of nodes) {
    if (node.id === deptId) return node;
    const found = findSubtree(node.children ?? [], deptId);
    if (found) return found;
  }
  return null;
}

// Recursively filter tree: include node if name matches OR has matching descendants
function filterBySearch(nodes: IDepartment[], query: string): IDepartment[] {
  if (!query) return nodes;
  const q = query.toLowerCase();
  return nodes.flatMap((node) => {
    const filteredChildren = filterBySearch(node.children ?? [], query);
    if (node.name.toLowerCase().includes(q) || filteredChildren.length) {
      return [{ ...node, children: filteredChildren }];
    }
    return [];
  });
}

export const HoDepartmentList = observer(function HoDepartmentList() {
  const [searchQuery, setSearchQuery] = useState("");
  const { currentWorkspace } = useWorkspace();
  const { data: staffProfile, isLoading: isProfileLoading } = useMyStaffProfile(currentWorkspace?.slug);

  // Check if current user is an instance admin
  const { data: adminStatus } = useSWR("INSTANCE_ADMIN_STATUS", () => userService.currentUserInstanceAdminStatus());
  const isInstanceAdmin = adminStatus?.is_instance_admin ?? false;

  const { data: tree, isLoading: isTreeLoading } = useSWR(
    currentWorkspace?.slug ? `DEPARTMENTS_TREE_${currentWorkspace.slug}` : null,
    () => departmentService.getDepartmentTree(currentWorkspace!.slug)
  );

  // Instance admins see full tree; department managers see only their managed subtree
  const managedTree = useMemo(() => {
    if (isInstanceAdmin) return tree ?? [];
    if (!staffProfile?.is_department_manager || !staffProfile.department) return [];
    const subtree = findSubtree(tree ?? [], staffProfile.department);
    return subtree ? [subtree] : [];
  }, [isInstanceAdmin, tree, staffProfile]);

  const filteredTree = useMemo(() => filterBySearch(managedTree, searchQuery), [managedTree, searchQuery]);

  if (isProfileLoading || isTreeLoading) {
    return (
      <div className="py-9 px-page-x lg:px-12 space-y-3">
        <Loader className="space-y-3">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      </div>
    );
  }

  return (
    <div className="size-full py-9 px-page-x lg:px-12">
      <div className="flex justify-between items-center pb-3.5">
        <h4 className="text-h3-medium">Departments</h4>
        <div className="flex items-center gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-1.5">
          <SearchIcon className="h-4 w-4 text-tertiary" />
          <input
            className="w-full max-w-[234px] border-none bg-transparent text-13 text-primary outline-none placeholder:text-tertiary"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {!managedTree.length ? (
        <h4 className="mt-16 text-center text-body-xs-regular text-placeholder">No departments found.</h4>
      ) : filteredTree.length === 0 ? (
        <h4 className="mt-16 text-center text-body-xs-regular text-placeholder">No matching departments.</h4>
      ) : (
        <div className="divide-y-[0.5px] divide-subtle overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-subtle bg-surface-1">
                <th className="px-4 py-3 text-12 font-medium text-secondary uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-12 font-medium text-secondary uppercase tracking-wide">
                  Linked Workspace
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTree.map((dept) => (
                <HoDepartmentTreeRow key={dept.id} dept={dept} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
