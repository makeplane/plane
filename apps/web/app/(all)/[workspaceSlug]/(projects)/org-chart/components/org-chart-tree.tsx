import type { IOrgChartDepartment } from "@/plane-web/services/org-chart.service";
import { OrgChartNode } from "./org-chart-node";

type Props = {
  departments: IOrgChartDepartment[];
};

export function OrgChartTree({ departments }: Props) {
  return (
    <div className="flex flex-col gap-0.5 p-4">
      {departments.map((dept) => (
        <OrgChartNode key={dept.id} department={dept} />
      ))}
    </div>
  );
}
