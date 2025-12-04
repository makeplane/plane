"use client";
import React from "react";
import { Table, Button, Spin } from "antd";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ColumnsType } from "antd/es/table";
import type { TBaseIssue, TIssue } from "@plane/types";
import { CaseService } from "../../../services/qa/case.service";
import { ReadonlyPriority } from "@/components/readonly/priority";
import { ReadonlyState } from "@/components/readonly/state";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { generateWorkItemLink } from "@plane/utils";
import { Logo } from "@/components/common/logo";

type TWorkItemType = "Requirement" | "Task" | "Bug";

type Project = {
  id: string;
  name: string;
  identifier: string;
};
type State = {
  id: string;
  name: string;
  group: string;
  color: string;
};

type CaseIssue = TBaseIssue & {
  description_html?: string;
  is_subscribed?: boolean;
  parent?: Partial<TBaseIssue>;
  // tempId is used for optimistic updates. It is not a part of the API response.
  tempId?: string;
  // sourceIssueId is used to store the original issue id when creating a copy of an issue. Used in cloning property values. It is not a part of the API response.
  sourceIssueId?: string;
  state__group?: string | null;
  project?: Project;
  state?: string;
  assignees?: string[];
};

type WorkItemDisplayModalProps = {
  caseId: string;
  defaultType?: TWorkItemType;
  className?: string;
  reloadToken?: number;
  onCountChange?: (n: number) => void;
};

export const WorkItemDisplayModal: React.FC<WorkItemDisplayModalProps> = ({
  caseId,
  defaultType = "Requirement",
  className,
  reloadToken,
  onCountChange,
}) => {
  const { workspaceSlug } = useParams() as { workspaceSlug?: string };
  const caseService = React.useMemo(() => new CaseService(), []);

  const [activeType, setActiveType] = React.useState<TWorkItemType>(defaultType);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [buttonLoading, setButtonLoading] = React.useState<Record<TWorkItemType, boolean>>({
    Requirement: false,
    Task: false,
    Bug: false,
  });
  const [issues, setIssues] = React.useState<TIssue[]>([]);
  const [pageSize, setPageSize] = React.useState<number>(10);
  const [currentPage, setCurrentPage] = React.useState<number>(1);

  const fetchIssues = async (type: TWorkItemType) => {
    if (!workspaceSlug || !caseId) return;
    setLoading(true);
    setButtonLoading((prev) => ({ ...prev, [type]: true }));
    try {
      const type_name = type === "Requirement" ? "史诗,特性,用户故事" : type === "Task" ? "任务" : "缺陷";
      const res = await caseService.issueList(String(workspaceSlug), {
        case_id: caseId,
        type_name,
        page_size: 1000,
      });
      const resolved: TIssue[] = Array.isArray((res as any)?.data)
        ? ((res as any).data as TIssue[])
        : Array.isArray(res)
          ? (res as TIssue[])
          : [];
      setIssues(resolved);
      onCountChange?.(resolved.length);
      setCurrentPage(1);
    } catch {
      onCountChange?.(0);
    } finally {
      setLoading(false);
      setButtonLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  React.useEffect(() => {
    fetchIssues(activeType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, caseId, reloadToken]);

  const priorityOrder: Record<string, number> = { urgent: 5, high: 4, medium: 3, low: 2, none: 1 };

  const columns: ColumnsType<TIssue> = React.useMemo(
    () => [
      {
        title: "标题",
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => (a?.name ?? "").localeCompare(b?.name ?? ""),
        render: (_: any, record: CaseIssue) => {
          const href = generateWorkItemLink({
            workspaceSlug: String(workspaceSlug ?? ""),
            projectId: record?.project?.id.toString() ?? undefined,
            issueId: record?.id ?? undefined,
            projectIdentifier: record?.project?.identifier,
            sequenceId: record?.sequence_id ?? undefined,
            isArchived: false,
            isEpic: false,
          });
          return (
            <Link href={href} className="text-blue-600 hover:underline">
              {record?.name ?? "-"}
            </Link>
          );
        },
      },

      {
        title: "项目",
        dataIndex: "project",
        key: "project",
        width: 200,
        render: (_: any, record: CaseIssue) => {
          const p: any = (record as any)?.project;
          const logoProps = p?.logo_props;
          const name = p?.name ?? String(p?.id ?? "");
          return (
            <div className="flex items-center gap-2">
              {logoProps ? <Logo logo={logoProps} size={16} /> : null}
              <span className="truncate">{name ?? "-"}</span>
            </div>
          );
        },
      },
      {
        title: "状态",
        dataIndex: "state_id",
        key: "state_id",
        width: 160,
        render: (_: any, record: CaseIssue) => (
          <ReadonlyState
            value={record?.state ?? undefined}
            projectId={record?.project?.id.toString() ?? ""}
            workspaceSlug={String(workspaceSlug ?? "")}
          />
        ),
      },

      {
        title: "优先级",
        dataIndex: "priority",
        key: "priority",
        width: 140,
        sorter: (a, b) => (priorityOrder[a?.priority ?? "none"] ?? 0) - (priorityOrder[b?.priority ?? "none"] ?? 0),
        render: (_: any, record: TIssue) => <ReadonlyPriority value={record?.priority ?? null} />,
      },
      {
        title: "负责人",
        dataIndex: "assignees",
        key: "assignees",
        width: 220,
        render: (_: any, record: CaseIssue) => {
          const assignees = record.assignees ?? [];
          return (
            <MemberDropdown
              value={assignees}
              onChange={() => {}}
              disabled
              projectId={String((record as any)?.project_id ?? (record as any)?.project ?? "")}
              multiple
              buttonVariant={assignees.length > 1 ? "transparent-without-text" : "transparent-with-text"}
              buttonClassName={`text-sm justify-between ${assignees.length > 0 ? "" : "text-custom-text-400"}`}
              hideIcon={assignees.length === 0}
              buttonContainerClassName="w-full text-left"
            />
          );
        },
      },
    ],
    [workspaceSlug]
  );

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3"></div>
      <Spin spinning={loading} delay={200}>
        <Table<TIssue>
          size="small"
          rowKey="id"
          loading={loading}
          dataSource={issues}
          columns={columns as any}
          pagination={{
            current: currentPage,
            pageSize,
            total: issues.length,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page) => setCurrentPage(page),
            onShowSizeChange: (_current, size) => setPageSize(size),
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Spin>
    </div>
  );
};

export default WorkItemDisplayModal;
