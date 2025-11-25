"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHead } from "@/components/core/page-title";
import { Breadcrumbs } from "@plane/ui";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import PlanCasesModal from "@/components/qa/plans/plan-cases-modal";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { Row, Col, Tree, Table, Space, Tag, message } from "antd";
import type { TableProps } from "antd";
import type { TreeProps } from "antd";
import { CaseModuleService } from "@/services/qa";
import { PlanService } from "@/services/qa/plan.service";
import { AppstoreOutlined } from "@ant-design/icons";
import { formatDateTime, globalEnums } from "../util";

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
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
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

  useEffect(() => {
    if (!workspaceSlug || !repositoryId) return;
    try {
      if (repositoryIdFromUrl) sessionStorage.setItem("selectedRepositoryId", repositoryIdFromUrl);
    } catch {}
    moduleService
      .getCaseModules(workspaceSlug as string, { repository_id: repositoryId })
      .then((data) => {
        setModules(Array.isArray(data) ? data : []);
        setExpandedKeys((Array.isArray(data) ? data : []).map((n: any) => n?.id).filter(Boolean));
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

  const treeData = useMemo(() => {
    const children = (modules || []).map((m: any) => ({
      title: m?.name ?? "-",
      key: String(m?.id ?? ""),
      icon: <AppstoreOutlined />,
    }));
    return [{ title: "全部模块", key: "all", icon: <AppstoreOutlined />, children }];
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
      render: (_: any, record: PlanCaseItem) => record?.case?.name ?? "-",
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
      <div className="px-4 py-3 border-b border-custom-border-200 flex items-center justify-between">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={<BreadcrumbLink href={`/${workspaceSlug}/test-management/plans`} label="测试计划" />}
            />
            <Breadcrumbs.Item component={<BreadcrumbLink label="测试计划详情" isLast />} />
          </Breadcrumbs>
        </div>
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsPlanModalOpen(true)}
            disabled={!repositoryId}
          >
            规划用例
          </Button>
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
              <div className="p-2">
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
    </div>
  );
}
