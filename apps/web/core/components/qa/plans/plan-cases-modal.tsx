"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tree, Table, Row, Col, Tag, message } from "antd";
import type { TreeProps } from "antd";
import type { TableProps } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { ModalCore, EModalPosition, EModalWidth } from "@plane/ui";
import { Button } from "@plane/propel/button";
import { CaseService } from "@/services/qa/case.service";
import { CaseModuleService } from "@/services/qa";
import { PlanService } from "@/services/qa/plan.service";
import { formatDateTime, globalEnums } from "app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/test-management/util";

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
type TestCaseResponse = { count: number; data: TestCase[] };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  repositoryId: string;
  repositoryName?: string;
  planId?: string;
  initialSelectedCaseIds?: string[];
  onClosed?: () => void;
};

export const PlanCasesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  workspaceSlug,
  repositoryId,
  repositoryName,
  planId,
  initialSelectedCaseIds,
  onClosed,
}) => {
  const Enums = globalEnums.Enums;
  const caseService = useRef(new CaseService()).current;
  const moduleService = useRef(new CaseModuleService()).current;
  const planService = useRef(new PlanService()).current;

  const [modules, setModules] = useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const [cases, setCases] = useState<TestCase[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const [leftWidth, setLeftWidth] = useState<number>(280);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const onMouseDownResize = (e: any) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
    window.addEventListener("mousemove", onMouseMoveResize as any);
    window.addEventListener("mouseup", onMouseUpResize as any);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    if (e && typeof e.preventDefault === "function") e.preventDefault();
  };
  const onMouseMoveResize = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    const next = Math.min(320, Math.max(200, startWidthRef.current + delta));
    setLeftWidth(next);
  };
  const onMouseUpResize = () => {
    isDraggingRef.current = false;
    window.removeEventListener("mousemove", onMouseMoveResize as any);
    window.removeEventListener("mouseup", onMouseUpResize as any);
    document.body.style.cursor = "auto";
    document.body.style.userSelect = "auto";
  };

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !repositoryId) return;
    moduleService
      .getCaseModules(String(workspaceSlug), { repository_id: repositoryId })
      .then((data: any[]) => {
        setModules(Array.isArray(data) ? data : []);
        setExpandedKeys((Array.isArray(data) ? data : []).map((n: any) => String(n?.id)).filter(Boolean));
      })
      .catch(() => setModules([]));
  }, [isOpen, workspaceSlug, repositoryId, moduleService]);

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !repositoryId) return;
    fetchCases(1, selectedModuleId || undefined);
    const init = Array.isArray(initialSelectedCaseIds) ? initialSelectedCaseIds.filter(Boolean) : [];
    setSelectedIds(init);
  }, [isOpen]);

  const fetchCases = async (page: number, moduleId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        repository_id: repositoryId,
        page,
        page_size: 10,
      };
      if (moduleId) params.module_id = moduleId;
      const response: TestCaseResponse = await caseService.getCases(String(workspaceSlug), params);
      setCases(response?.data || []);
      setTotal(response?.count || 0);
      setCurrentPage(page);
    } catch (e) {
      setError("用例加载失败");
    } finally {
      setLoading(false);
    }
  };

  const onSelect: TreeProps["onSelect"] = (selectedKeys) => {
    const key = Array.isArray(selectedKeys) && selectedKeys.length > 0 ? String(selectedKeys[0]) : null;
    setSelectedModuleId(key === "all" ? null : key);
    fetchCases(1, key === "all" ? undefined : key || undefined);
  };

  const onExpand: TreeProps["onExpand"] = (keys) => {
    setExpandedKeys(keys as string[]);
    setAutoExpandParent(false);
  };

  const buildTreeNodes = (list: any[]): any[] => {
    if (!Array.isArray(list)) return [];
    return list.map((node: any) => ({
      title: node?.name ?? "-",
      key: String(node?.id ?? ""),
      icon: <AppstoreOutlined />,
      children: buildTreeNodes(node?.children || []),
    }));
  };
  const treeData = useMemo(() => {
    const children = buildTreeNodes(modules || []);
    return [{ title: "全部模块", key: "all", icon: <AppstoreOutlined />, children }];
  }, [modules]);

  const columns: TableProps<TestCase>["columns"] = [
    { title: "名称", dataIndex: "name", key: "name" },
    {
      title: "状态",
      dataIndex: "state",
      key: "state",
      render: (v: number) => {
        const label = (Enums as any)?.case_state?.[v] || "-";
        return <Tag>{label}</Tag>;
      },
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (v: number) => {
        const label = (Enums as any)?.case_type?.[v] || "-";
        return <Tag>{label}</Tag>;
      },
    },
    {
      title: "优先级",
      dataIndex: "priority",
      key: "priority",
      render: (v: number) => {
        const label = (Enums as any)?.case_priority?.[v] || "-";
        return <Tag>{label}</Tag>;
      },
    },
    {
      title: "更新时间",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (v: string) => (v ? formatDateTime(v) : "-"),
    },
  ];

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={() => {
        onClose();
        onClosed && onClosed();
      }}
      position={EModalPosition.CENTER}
      width={EModalWidth.VXL}
    >
      <div className="w-full">
        <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 px-6 py-4">
          <h3 className="text-lg font-medium">
            规划用例{repositoryName ? ` - ${decodeURIComponent(repositoryName)}` : ""}
          </h3>
          <Button
            variant="neutral-primary"
            onClick={() => {
              onClose();
              onClosed && onClosed();
            }}
            size="sm"
          >
            关闭
          </Button>
        </div>
        <Row wrap={false} className="h-[80vh] max-h-[80vh] overflow-hidden p-6" gutter={[0, 16]}>
          <Col
            className="relative border-r border-custom-border-200 overflow-y-auto"
            flex="0 0 auto"
            style={{ width: leftWidth, minWidth: 200, maxWidth: 320 }}
          >
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="text-sm text-custom-text-300">用例模块</div>
            </div>
            <div
              onMouseDown={onMouseDownResize}
              className="absolute right-0 top-0 h-full w-2"
              style={{ cursor: "col-resize", zIndex: 10 }}
            />
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
            {!loading && !error && cases.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="text-custom-text-300">暂无用例</div>
              </div>
            )}
            {!loading && !error && cases.length > 0 && (
              <Table
                dataSource={cases}
                columns={columns}
                rowKey="id"
                bordered={true}
                rowSelection={{
                  selectedRowKeys: selectedIds,
                  onChange: (keys) => setSelectedIds(keys as string[]),
                  preserveSelectedRowKeys: true,
                  selections: [
                    {
                      key: "select-all",
                      text: "本页全选",
                      onSelect: () =>
                        setSelectedIds((prev) => Array.from(new Set([...prev, ...cases.map((c) => c.id)]))),
                    },
                    {
                      key: "clear-all",
                      text: "清空选择",
                      onSelect: () => setSelectedIds([]),
                    },
                  ],
                }}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: total,
                  showSizeChanger: false,
                  showQuickJumper: true,
                  showTotal: (t, r) => `第 ${r[0]}-${r[1]} 条，共 ${t} 条`,
                }}
                onChange={(p) => {
                  const nextPage = p?.current || 1;
                  fetchCases(nextPage, selectedModuleId || undefined);
                }}
              />
            )}
          </Col>
        </Row>
        <div className="sticky bottom-0 w-full bg-custom-background-100 border-t border-custom-border-200 px-6 py-3 flex items-center justify-end gap-3">
          <Button
            variant="neutral-primary"
            onClick={() => {
              onClose();
              onClosed && onClosed();
            }}
            size="sm"
          >
            取消
          </Button>
          <Button
            variant="primary"
            disabled={saving || !workspaceSlug || !repositoryId || !planId}
            onClick={async () => {
              if (!workspaceSlug || !planId) {
                message.error("缺少必要参数：workspace或计划ID");
                return;
              }
              try {
                setSaving(true);
                await planService.updatePlan(String(workspaceSlug), { id: planId, cases: selectedIds });
                message.success("用例关联已更新");
                onClose();
                onClosed && onClosed();
              } catch (e: any) {
                message.error(e?.detail || e?.message || "用例关联失败");
              } finally {
                setSaving(false);
              }
            }}
            size="sm"
          >
            {saving ? "处理中..." : "确定"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
};

export default PlanCasesModal;
