import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2';
import { AnalyticsV2Service } from '@/services/analytics-v2.service';
import { WorkItemInsightColumns, AnalyticsTableDataMap } from '@plane/types';
import { observer } from 'mobx-react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { InsightTable } from '../insight-table';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Logo } from '@/components/common/logo';
import { Briefcase } from 'lucide-react';
import { useProject } from '@/hooks/store/use-project';

const analyticsV2Service = new AnalyticsV2Service();

const WorkItemsInsightTable = observer(() => {
    const params = useParams();
    const workspaceSlug = params.workspaceSlug as string;
    const { getProjectById } = useProject();
    const { selectedDuration, selectedProject } = useAnalyticsV2()
    const { data: workItemsData, isLoading } = useSWR(`insights-table-work-items-${selectedDuration}-${selectedProject}`,
        () => analyticsV2Service.getAdvanceAnalyticsStats<WorkItemInsightColumns[]>(workspaceSlug, "work-items", {
            date_filter: selectedDuration,
            ...(selectedProject ? { project_ids: selectedProject } : {})
        }))

    const columns = useMemo(() => {
        return [
            {
                accessorKey: "project__name",
                header: () => <div className="text-left">Project</div>,
                cell: ({ row }) => {
                    const project = getProjectById(row.original.project_id);
                    return <div className='flex items-center gap-2'>
                        {project?.logo_props ? (
                            <Logo logo={project.logo_props} size={18} />
                        ) : (
                            <Briefcase className="w-4 h-4" />
                        )}
                        {project?.name}
                    </div>
                }
            },
            {
                accessorKey: "backlog_work_items",
                header: () => <div className="text-right">Backlog</div>,
                cell: ({ row }) => {
                    return <div className="text-right">{row.original.backlog_work_items}</div>
                }
            },
            {
                accessorKey: "started_work_items",
                header: () => <div className="text-right">Started</div>,
                cell: ({ row }) => {
                    return <div className="text-right">{row.original.started_work_items}</div>
                }
            },
            {
                accessorKey: "un_started_work_items",
                header: () => <div className="text-right">Unstarted</div>,
                cell: ({ row }) => {
                    return <div className="text-right">{row.original.un_started_work_items}</div>
                }
            },
            {
                accessorKey: "completed_work_items",
                header: () => <div className="text-right">Completed</div>,
                cell: ({ row }) => {
                    return <div className="text-right">{row.original.completed_work_items}</div>
                }
            },
            {
                accessorKey: "cancelled_work_items",
                header: () => <div className="text-right">Cancelled</div>,
                cell: ({ row }) => {
                    return <div className="text-right">{row.original.cancelled_work_items}</div>
                }
            }
        ] as ColumnDef<AnalyticsTableDataMap["work-items"]>[]
    }, [getProjectById])

    return (
        <InsightTable<"work-items">
            analyticsType="work-items"
            data={workItemsData}
            isLoading={isLoading}
            columns={columns}
        />
    )
})

export default WorkItemsInsightTable