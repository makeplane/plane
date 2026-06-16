import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { IChangeRequest } from "@/services/change-management.service";

type Props = {
  changes: IChangeRequest[];
  isLoading: boolean;
};

export const ChangeTable = observer(({ changes, isLoading }: Props) => {
  const { workspaceSlug } = useParams();

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-secondary">
        <p>No changes found.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-md border border-subtle">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-layer-1 text-secondary">
          <tr>
            <th className="px-4 py-3 font-medium">Number</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium w-full min-w-[200px]">Short Description</th>
            <th className="px-4 py-3 font-medium">State</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Risk</th>
            <th className="px-4 py-3 font-medium">Requested By</th>

          </tr>
        </thead>
        <tbody className="divide-y divide-subtle bg-surface-1">
          {changes.map((change) => (
            <tr key={change.id} className="hover:bg-layer-1 transition-colors">
              <td className="px-4 py-3 font-medium text-blue-600">
                <Link href={`/${workspaceSlug}/change/${encodeURIComponent(change.number)}`}>
                  {change.number}
                </Link>
              </td>
              <td className="px-4 py-3 capitalize">{change.type}</td>
              <td className="px-4 py-3 truncate max-w-xs">{change.short_description}</td>
              <td className="px-4 py-3 capitalize">{change.state}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  change.priority === "1_critical" ? "bg-red-100 text-red-700" :
                  change.priority === "2_high" ? "bg-orange-100 text-orange-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {change.priority.replace(/^\d+_/, "")}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  change.risk === "1_critical" ? "bg-red-100 text-red-700" :
                  change.risk === "2_high" ? "bg-orange-100 text-orange-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {change.risk.replace(/^\d+_/, "")}
                </span>
              </td>
              <td className="px-4 py-3">{change.requested_by_display || "—"}</td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
