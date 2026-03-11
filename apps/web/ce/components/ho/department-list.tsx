import { useState, useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import type { IInstanceDepartment } from "@plane/services";
import { InstanceDepartmentService } from "@plane/services";
import { Loader } from "@plane/ui";
import { SearchIcon } from "@plane/propel/icons";
import { HoDepartmentTreeRow } from "./department-tree-row";

const instanceDepartmentService = new InstanceDepartmentService();

// Recursively filter tree: include node if name matches OR has matching descendants
function filterTree(nodes: IInstanceDepartment[], query: string): IInstanceDepartment[] {
  if (!query) return nodes;
  const q = query.toLowerCase();
  return nodes.flatMap((node) => {
    const filteredChildren = filterTree(node.children ?? [], query);
    if (node.name.toLowerCase().includes(q) || filteredChildren.length) {
      return [{ ...node, children: filteredChildren }];
    }
    return [];
  });
}

export const HoDepartmentList = observer(function HoDepartmentList() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tree, isLoading } = useSWR("INSTANCE_DEPARTMENTS_TREE", () =>
    instanceDepartmentService.getTree()
  );

  const filteredTree = useMemo(() => filterTree(tree ?? [], searchQuery), [tree, searchQuery]);

  if (isLoading) {
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
        <div className="flex items-center gap-1.5 rounded-md border border-subtle bg-surface-1 px-2.5 py-1.5">
          <SearchIcon className="h-3.5 w-3.5 text-placeholder" />
          <input
            className="w-full max-w-[234px] border-none bg-transparent text-body-xs-regular outline-none placeholder:text-placeholder"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {!tree?.length ? (
        <h4 className="mt-16 text-center text-body-xs-regular text-placeholder">No departments found.</h4>
      ) : filteredTree.length === 0 ? (
        <h4 className="mt-16 text-center text-body-xs-regular text-placeholder">No matching departments.</h4>
      ) : (
        <div className="divide-y-[0.5px] divide-subtle overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-subtle">
                <th className="px-3 py-2.5 text-xs font-medium text-placeholder uppercase tracking-wide">Name</th>
                <th className="px-4 py-2.5 text-xs font-medium text-placeholder uppercase tracking-wide">Linked Workspace</th>
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
