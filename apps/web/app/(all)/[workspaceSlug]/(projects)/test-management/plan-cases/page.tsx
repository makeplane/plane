"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, cloneElement } from "react";
import { PageHead } from "@/components/core/page-title";
import { Breadcrumbs } from "@plane/ui";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import PlanCasesModal from "@/components/qa/plans/plan-cases-modal";
import PlanIterationModal from "@/components/qa/plans/plan-iteration-modal";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { Row, Col, Tree, Table, Space, Tag, message, Dropdown } from "antd";
import type { TableProps } from "antd";
import type { TreeProps } from "antd";
import { CaseModuleService } from "@/services/qa";
import { PlanService } from "@/services/qa/plan.service";
import { AppstoreOutlined, DeploymentUnitOutlined, DownOutlined } from "@ant-design/icons";
import { formatDateTime, globalEnums } from "../util";
import { FolderOpenDot } from "lucide-react";

type TLabel = { id?: string; name?: string } | string;
type TestCase = {
  id: string;
  name: string;
  remark?: string;
  state?: number;
  type?: number;
  priority?: number;
  created_at?: string;
  updated_at?: string;
  repository?: string;
  labels?: TLabel[];
};
type PlanCaseItem = {
  id: string;
  result?: string;
  case?: TestCase;
};
type PlanCaseResponse = { count: number; data: PlanCaseItem[] };

export default function PlanCasesPage() {
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("planId");
  const repositoryIdFromUrl = searchParams.get("repositoryId");
  const repositoryId =
    repositoryIdFromUrl || (typeof window !== "undefined" ? sessionStorage.getItem("selectedRepositoryId") : null);
  const repositoryName = typeof window !== "undefined" ? sessionStorage.getItem("selectedRepositoryName") : "";
  const Enums = globalEnums.Enums;

  const planService = useRef(new PlanService()).current;
  const moduleService = useRef(new CaseModuleService()).current;

  const [modules, setModules] = useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[] | undefined>(undefined);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const [cases, setCases] = useState<PlanCaseItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [activeCase, setActiveCase] = useState<TestCase | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [isIterationModalOpen, setIsIterationModalOpen] = useState<boolean>(false);

  const dropdownItems = [
    { key: "by_work_item", label: "通过工作项规划" },
    { key: "by_iteration", label: "通过迭代规划" },
    { key: "by_release", label: "通过发布规划" },
  ];

  useEffect(() => {
    if (!workspaceSlug || !repositoryId) return;
    try {
      if (repositoryIdFromUrl) sessionStorage.setItem("selectedRepositoryId", repositoryIdFromUrl);
    } catch {}
    moduleService
      .getCaseModules(workspaceSlug as string, { repository_id: repositoryId })
      .then((data) => {
        setModules(Array.isArray(data) ? data : []);
        setExpandedKeys(undefined);
        setAutoExpandParent(true);
      })
      .catch(() => {})
      .finally(() => {});
  }, [workspaceSlug, repositoryId, moduleService]);

  useEffect(() => {
    if (!repositoryId && workspaceSlug) {
      const ws = String(workspaceSlug || "");
      const current = `/${ws}/test-management/plan-cases${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      try {
        message.warning("未检测到用例库，请选择一个用例库后自动跳回");
      } catch {}
      router.push(`/${ws}/test-management?redirect_to=${encodeURIComponent(current)}`);
    }
  }, [repositoryId, workspaceSlug, searchParams, router]);

  useEffect(() => {
    if (!workspaceSlug || !repositoryId || !planId) return;
    fetchCases(1, pageSize, selectedModuleId || undefined);
  }, [workspaceSlug, repositoryId, planId]);

  const fetchCases = async (page: number, size: number, moduleId?: string) => {
    if (!workspaceSlug || !repositoryId || !planId) return;
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        page_size: size,
        plan_id: planId,
      };
      if (moduleId) params["case__module_id"] = moduleId;
      const response: PlanCaseResponse = await planService.getPlanCases(workspaceSlug as string, params);
      setCases(response?.data || []);
      setTotal(response?.count || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (e) {
      setError("用例加载失败");
    } finally {
      setLoading(false);
    }
  };

  const onSelect: TreeProps["onSelect"] = (selectedKeys) => {
    const key = Array.isArray(selectedKeys) && selectedKeys.length > 0 ? String(selectedKeys[0]) : null;
    setSelectedModuleId(key === "all" ? null : key);
    fetchCases(1, pageSize, key === "all" ? undefined : key || undefined);
  };

  const onExpand: TreeProps["onExpand"] = (keys) => {
    setExpandedKeys(keys as string[]);
    setAutoExpandParent(false);
  };

  const getNodeCount = (m: any) => {
    const c = m?.case_count ?? m?.count ?? m?.total ?? m?.cases_count;
    return typeof c === "number" ? c : undefined;
  };

  const renderNodeTitle = (title: string, count?: number) => {
    return (
      <div className="group flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 text-custom-text-300">
            <FolderOpenDot size={14} />
          </span>
          <span className="text-sm text-custom-text-200">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {typeof count === "number" && <span className="text-xs text-custom-text-300">{count}</span>}
        </div>
      </div>
    );
  };

  const buildTreeNodes = (list: any[]): any[] => {
    if (!Array.isArray(list)) return [];
    return list.map((node: any) => {
      const nodeId = String(node?.id);
      const childrenNodes = buildTreeNodes(node?.children || []);
      return {
        title: renderNodeTitle(node?.name ?? "-", getNodeCount(node)),
        key: nodeId,
        icon: <AppstoreOutlined />,
        children: childrenNodes,
      };
    });
  };

  const treeData = useMemo(() => {
    return [
      {
        title: (
          <div className="group flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 text-custom-text-300">
                <AppstoreOutlined />
              </span>
              <span className="text-sm font-medium text-custom-text-200">全部模块</span>
            </div>
            <div className="flex items-center gap-2" />
          </div>
        ),
        key: "all",
        icon: <AppstoreOutlined />,
        children: buildTreeNodes(modules),
      },
    ];
  }, [modules]);

  const onCancelRelation = async (record: PlanCaseItem) => {
    const caseId = record?.case?.id;
    if (!workspaceSlug || !planId || !caseId) return;
    try {
      await planService.cancelPlanCase(String(workspaceSlug), record.id);
      const data = await moduleService.getCaseModules(String(workspaceSlug), { repository_id: repositoryId });
      setModules(Array.isArray(data) ? data : []);
      setExpandedKeys((Array.isArray(data) ? data : []).map((n: any) => n?.id).filter(Boolean));
      await fetchCases(currentPage, pageSize, selectedModuleId || undefined);
    } catch (e) {
      setError("取消关联失败");
    }
  };

  const columns: TableProps<PlanCaseItem>["columns"] = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      render: (_: any, record: PlanCaseItem) => {
        const name = record?.case?.name ?? "-";
        const cid = record?.case?.id;
        if (!cid) return name;
        const repoQuery = repositoryId ? `&repositoryId=${encodeURIComponent(String(repositoryId))}` : "";
        return (
          <Button
            type="link"
            onClick={() =>
              router.push(
                `/${workspaceSlug}/test-management/test-execution?case_id=${encodeURIComponent(String(cid))}&plan_id=${encodeURIComponent(String(planId || ""))}${repoQuery}`
              )
            }
          >
            {name}
          </Button>
        );
      },
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (_: any, record: PlanCaseItem) => {
        const v = record?.case?.type as number;
        const label = Enums?.case_type?.[v] || "-";
        return <Tag>{label}</Tag>;
      },
    },
    {
      title: "优先级",
      dataIndex: "priority",
      key: "priority",
      render: (_: any, record: PlanCaseItem) => {
        const v = record?.case?.priority as number;
        const label = Enums?.case_priority?.[v] || "-";
        return <Tag>{label}</Tag>;
      },
    },
    {
      title: "执行结果",
      dataIndex: "result",
      key: "result",
      render: (_: any, record: PlanCaseItem) => {
        const label = record?.result || "-";
        const color = (Enums as any)?.plan_case_result?.[label];
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "更新时间",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (_: any, record: PlanCaseItem) =>
        record?.case?.updated_at ? formatDateTime(record.case.updated_at) : "-",
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: PlanCaseItem) => (
        <Space>
          <Button
            size="small"
            type="link"
            onClick={() => {
              const cid = record?.case?.id;
              if (!cid) return;
              const repoQuery = repositoryId ? `&repositoryId=${encodeURIComponent(String(repositoryId))}` : "";
              router.push(
                `/${workspaceSlug}/test-management/test-execution?case_id=${encodeURIComponent(String(cid))}&plan_id=${encodeURIComponent(String(planId || ""))}${repoQuery}`
              );
            }}
          >
            执行
          </Button>
          <Button size="small" type="link" danger onClick={() => onCancelRelation(record)}>
            取消关联
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <PageHead title="计划用例" description={repositoryName || ""} />
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={<BreadcrumbLink href={`/${workspaceSlug}/test-management/plans`} label="测试计划" />}
            />
            <Breadcrumbs.Item component={<BreadcrumbLink label="测试计划详情" isLast />} />
          </Breadcrumbs>
        </div>
        <div>
          <Dropdown.Button
            type="primary"
            icon={<DownOutlined />}
            menu={{
              items: dropdownItems,
              onClick: ({ key }) => {
                if (key === "by_work_item") {
                  setIsPlanModalOpen(true);
                } else if (key === "by_iteration") {
                  setIsIterationModalOpen(true);
                } else if (key === "by_release") {
                  message.info("通过发布规划暂未实现");
                }
              },
            }}
            onClick={() => setIsPlanModalOpen(true)}
            disabled={!repositoryId}
            style={{ backgroundColor: "#6897f7", borderColor: "#6897f7" }}
            buttonsRender={(buttons) => [
              cloneElement(buttons[0] as any, { style: { backgroundColor: "#6897f7", borderColor: "#6897f7" } }),
              cloneElement(buttons[1] as any, { style: { backgroundColor: "#6897f7", borderColor: "#6897f7" } }),
            ]}
          >
            规划用例
          </Dropdown.Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Row className="h-full">
          <Col
            className="relative border-r border-custom-border-200 overflow-y-auto"
            flex="0 0 auto"
            style={{ width: 280, minWidth: 200, maxWidth: 320 }}
          >
            <Tree
              showLine={false}
              defaultExpandAll
              onSelect={onSelect}
              onExpand={onExpand}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              treeData={treeData}
              selectedKeys={selectedModuleId ? [selectedModuleId] : ["all"]}
              className="py-2"
            />
          </Col>
          <Col flex="auto" className="overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-custom-text-300">加载中...</div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}
            {!loading && !error && (
              <div className="px-0 py-2">
                <Table
                  dataSource={cases}
                  columns={columns}
                  rowKey={(row) => row?.case?.id || row?.id}
                  bordered={true}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (t, r) => `第 ${r[0]}-${r[1]} 条，共 ${t} 条`,
                    pageSizeOptions: ["10", "20", "50", "100"],
                  }}
                  onChange={(p) => {
                    const nextSize = p?.pageSize || pageSize;
                    const nextPage = p?.current || 1;
                    fetchCases(nextPage, nextSize, selectedModuleId || undefined);
                  }}
                />
              </div>
            )}
          </Col>
        </Row>
      </div>
      <PlanCasesModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        workspaceSlug={String(workspaceSlug)}
        repositoryId={String(repositoryId)}
        repositoryName={decodeURIComponent(repositoryName || "")}
        planId={String(planId || "")}
        initialSelectedCaseIds={(cases || []).map((c) => c?.case?.id).filter((id): id is string => Boolean(id))}
        onClosed={() => {
          // 关闭后刷新列表，保留当前查询参数与筛选
          fetchCases(currentPage, pageSize, selectedModuleId || undefined);
        }}
      />
      <PlanIterationModal
        isOpen={isIterationModalOpen}
        onClose={() => setIsIterationModalOpen(false)}
        workspaceSlug={String(workspaceSlug)}
        repositoryId={String(repositoryId)}
        planId={String(planId || "")}
        onClosed={() => {
          fetchCases(currentPage, pageSize, selectedModuleId || undefined);
        }}
      />
    </div>
  );
}
